#!/bin/bash
set -euo pipefail

# ============================================================
# NHL Team Analytics - One-Command Deploy Script
# ============================================================
# Prerequisites:
#   - Databricks CLI (v0.229.0+) authenticated to target workspace
#   - Node.js 18+ and npm
#   - uv (Python package manager)
#   - psql (brew install postgresql@16)
#
# Usage:
#   ./deploy.sh --profile <databricks-profile>
#
# The script will prompt for any required values not provided.
# ============================================================

PROFILE=""
WAREHOUSE_ID=""
LAKEBASE_INSTANCE="nhl-comments"
MODEL_ENDPOINT="databricks-claude-sonnet-4-5"
PUCKPEDIA_KEY="YOUR_PUCKPEDIA_API_KEY"

# Parse args
while [[ $# -gt 0 ]]; do
    case $1 in
        --profile) PROFILE="$2"; shift 2 ;;
        --warehouse-id) WAREHOUSE_ID="$2"; shift 2 ;;
        --lakebase-instance) LAKEBASE_INSTANCE="$2"; shift 2 ;;
        --model-endpoint) MODEL_ENDPOINT="$2"; shift 2 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

if [ -z "$PROFILE" ]; then
    echo "Usage: ./deploy.sh --profile <databricks-profile>"
    echo ""
    echo "Available profiles:"
    databricks auth profiles 2>/dev/null | head -20
    exit 1
fi

echo "============================================================"
echo " NHL Team Analytics - Deployment"
echo "============================================================"
echo " Profile: $PROFILE"
echo ""

# Validate auth
echo "[1/8] Validating Databricks authentication..."
USER=$(databricks current-user me --profile="$PROFILE" -o json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['userName'])")
echo "  Authenticated as: $USER"

# Get or create SQL warehouse
echo "[2/8] Checking SQL warehouse..."
if [ -z "$WAREHOUSE_ID" ]; then
    WAREHOUSE_ID=$(databricks warehouses list --profile="$PROFILE" -o json 2>/dev/null | python3 -c "
import sys,json
wh = json.load(sys.stdin)
if isinstance(wh, dict): wh = wh.get('warehouses', [])
for w in wh:
    print(w['id'])
    break
" 2>/dev/null || echo "")
fi

if [ -z "$WAREHOUSE_ID" ]; then
    echo "  No SQL warehouse found. Please create one in the workspace first."
    exit 1
fi
echo "  Using warehouse: $WAREHOUSE_ID"

# Create Lakebase instance
echo "[3/8] Setting up Lakebase instance..."
LAKEBASE_STATE=$(databricks database get-database-instance "$LAKEBASE_INSTANCE" -p "$PROFILE" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('state',''))" 2>/dev/null || echo "")

if [ -z "$LAKEBASE_STATE" ]; then
    echo "  Creating Lakebase instance '$LAKEBASE_INSTANCE'..."
    databricks database create-database-instance "$LAKEBASE_INSTANCE" \
        --capacity=CU_1 \
        --enable-pg-native-login \
        --no-wait \
        -p "$PROFILE" > /dev/null 2>&1
    echo "  Waiting for Lakebase to be available..."
    while [ "$(databricks database get-database-instance "$LAKEBASE_INSTANCE" -p "$PROFILE" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['state'])" 2>/dev/null)" != "AVAILABLE" ]; do
        sleep 15
    done
fi

LAKEBASE_HOST=$(databricks database get-database-instance "$LAKEBASE_INSTANCE" -p "$PROFILE" -o json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['read_write_dns'])")
echo "  Lakebase host: $LAKEBASE_HOST"

# Create Lakebase database and table
echo "  Creating database and comments table..."
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
databricks psql "$LAKEBASE_INSTANCE" -p "$PROFILE" -- -c "SELECT 1 FROM pg_database WHERE datname='nhl_comments'" 2>/dev/null | grep -q "1" || \
    databricks psql "$LAKEBASE_INSTANCE" -p "$PROFILE" -- -c "CREATE DATABASE nhl_comments;" 2>/dev/null

databricks psql "$LAKEBASE_INSTANCE" -p "$PROFILE" -- -d nhl_comments -c "
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    game_id BIGINT NOT NULL,
    event_id INT NOT NULL,
    event_type VARCHAR(50),
    event_description TEXT,
    comment_text TEXT NOT NULL,
    author VARCHAR(100) DEFAULT 'Coach',
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_game ON comments(game_id);
" 2>/dev/null
echo "  Lakebase ready."

# Build frontend
echo "[4/8] Building frontend..."
cd frontend
npm install --registry=https://registry.npmmirror.com 2>/dev/null || npm install
npx tsc -b && npx vite build
cd ..
echo "  Frontend built."

# Create schema and seed data
echo "[5/8] Creating Unity Catalog schema..."
CATALOG=$(databricks catalogs list --profile="$PROFILE" -o json 2>/dev/null | python3 -c "
import sys,json
cats = json.load(sys.stdin)
if isinstance(cats, dict): cats = cats.get('catalogs', [])
for c in cats:
    name = c.get('name','') if isinstance(c, dict) else c
    if name not in ('system', 'samples', 'skyline_catalog', 'fevm_shared_catalog') and '_catalog' in name:
        print(name)
        break
" 2>/dev/null)
echo "  Using catalog: $CATALOG"

# Update the ingestion notebook catalog reference
sed -i.bak "s/CATALOG = \"nhl_demo_catalog\"/CATALOG = \"$CATALOG\"/" pipeline/ingest_nhl_data.py 2>/dev/null || true
sed -i.bak "s/nhl_demo_catalog/$CATALOG/g" backend/main.py 2>/dev/null || true

# Upload pipeline notebooks
echo "[6/8] Uploading pipeline notebooks..."
databricks workspace mkdirs "/Workspace/Users/$USER/nhl-pipeline" --profile="$PROFILE" 2>/dev/null || true
for nb in pipeline/*.py; do
    name=$(basename "$nb" .py)
    databricks workspace import "/Workspace/Users/$USER/nhl-pipeline/$name" \
        --file "$nb" --format SOURCE --language PYTHON --overwrite --profile="$PROFILE" 2>/dev/null
done
echo "  Notebooks uploaded."

# Deploy app
echo "[7/8] Deploying Databricks App..."
# Create app if it doesn't exist
databricks apps create nhl-team-analytics \
    --description "NHL Team Analytics - Interactive dashboard with AI assistant" \
    --no-wait --profile="$PROFILE" 2>/dev/null || true

# Wait for compute
echo "  Waiting for app compute..."
for i in $(seq 1 30); do
    STATE=$(databricks apps get nhl-team-analytics --profile="$PROFILE" -o json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['compute_status']['state'])" 2>/dev/null)
    [ "$STATE" = "ACTIVE" ] && break
    sleep 10
done

# Update app.yaml with resolved values
cat > app.yaml << APPEOF
command:
  - uvicorn
  - backend.main:app
  - --host
  - 0.0.0.0
  - --port
  - "8000"

env:
  - name: PUCKPEDIA_API_KEY
    value: $PUCKPEDIA_KEY
  - name: DATABRICKS_WAREHOUSE_ID
    value: $WAREHOUSE_ID
  - name: LAKEBASE_HOST
    value: $LAKEBASE_HOST

resources:
  - name: serving-endpoint
    serving_endpoint:
      name: $MODEL_ENDPOINT
      permission: CAN_QUERY
  - name: sql-warehouse
    sql_warehouse:
      id: $WAREHOUSE_ID
      permission: CAN_USE
  - name: lakebase
    database:
      instance_name: $LAKEBASE_INSTANCE
      database_name: nhl_comments
      permission: CAN_CONNECT_AND_CREATE
APPEOF

# Update app resources
databricks apps update nhl-team-analytics --profile="$PROFILE" --json "{
  \"resources\": [
    {\"name\": \"serving-endpoint\", \"serving_endpoint\": {\"name\": \"$MODEL_ENDPOINT\", \"permission\": \"CAN_QUERY\"}},
    {\"name\": \"sql-warehouse\", \"sql_warehouse\": {\"id\": \"$WAREHOUSE_ID\", \"permission\": \"CAN_USE\"}},
    {\"name\": \"lakebase\", \"database\": {\"instance_name\": \"$LAKEBASE_INSTANCE\", \"database_name\": \"nhl_comments\", \"permission\": \"CAN_CONNECT_AND_CREATE\"}}
  ]
}" > /dev/null 2>&1

# Sync and deploy
databricks sync . "/Workspace/Users/$USER/nhl-team-analytics" \
    --profile="$PROFILE" --watch=false \
    --exclude frontend --exclude .venv --exclude __pycache__ \
    --exclude node_modules --exclude pipeline --exclude .git > /dev/null 2>&1

DEPLOY=$(databricks apps deploy nhl-team-analytics \
    --source-code-path "/Workspace/Users/$USER/nhl-team-analytics" \
    --profile="$PROFILE" --no-wait -o json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['deployment_id'])")

echo "  Waiting for deployment..."
for i in $(seq 1 20); do
    DSTATE=$(databricks apps get-deployment nhl-team-analytics "$DEPLOY" --profile="$PROFILE" -o json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['status']['state'])" 2>/dev/null)
    [ "$DSTATE" = "SUCCEEDED" ] || [ "$DSTATE" = "FAILED" ] && break
    sleep 8
done

# Grant app SP access to catalog
echo "  Granting permissions..."
SP_ID=$(databricks apps get nhl-team-analytics --profile="$PROFILE" -o json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['service_principal_client_id'])")

for STMT in \
    "GRANT USE CATALOG ON CATALOG $CATALOG TO \`$SP_ID\`" \
    "GRANT USE SCHEMA ON SCHEMA $CATALOG.nhl_analytics TO \`$SP_ID\`" \
    "GRANT SELECT ON SCHEMA $CATALOG.nhl_analytics TO \`$SP_ID\`"; do
    databricks api post /api/2.0/sql/statements --profile="$PROFILE" --json "{
        \"warehouse_id\": \"$WAREHOUSE_ID\",
        \"statement\": \"$STMT\",
        \"wait_timeout\": \"30s\"
    }" > /dev/null 2>&1
done

# Grant Lakebase table permissions
databricks psql "$LAKEBASE_INSTANCE" -p "$PROFILE" -- -d nhl_comments -c "
GRANT ALL ON TABLE comments TO \"$SP_ID\";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO \"$SP_ID\";
" 2>/dev/null

# Run initial data ingestion
echo "[8/8] Running initial data ingestion..."
JOB_ID=$(databricks jobs list --profile="$PROFILE" -o json 2>/dev/null | python3 -c "
import sys,json
jobs = json.load(sys.stdin)
if isinstance(jobs, dict): jobs = jobs.get('jobs', [])
for j in jobs:
    if 'NHL Data Ingestion' in j.get('settings',{}).get('name',''):
        print(j['job_id'])
        break
" 2>/dev/null)

if [ -n "$JOB_ID" ]; then
    databricks jobs run-now "$JOB_ID" --no-wait --profile="$PROFILE" > /dev/null 2>&1
    echo "  Ingestion job triggered."
fi

APP_URL=$(databricks apps get nhl-team-analytics --profile="$PROFILE" -o json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('url',''))")

echo ""
echo "============================================================"
echo " Deployment Complete!"
echo "============================================================"
echo ""
echo " App URL:     $APP_URL"
echo " Workspace:   $(databricks auth env --profile="$PROFILE" 2>/dev/null | grep DATABRICKS_HOST | cut -d= -f2)"
echo " Catalog:     $CATALOG"
echo " Warehouse:   $WAREHOUSE_ID"
echo " Lakebase:    $LAKEBASE_INSTANCE ($LAKEBASE_HOST)"
echo " Ingestion:   Every 30 minutes"
echo ""
echo " Notebooks:"
echo "   /Workspace/Users/$USER/nhl-pipeline/ingest_nhl_data"
echo "   /Workspace/Users/$USER/nhl-pipeline/manage_injuries"
echo ""
echo " To update injury data:"
echo "   Open manage_injuries notebook, fill out widgets, Run All"
echo ""
echo "============================================================"

# NHL Team Analytics - Databricks Demo

A full-stack Databricks App showcasing the platform's capabilities through an NHL team analytics dashboard. Built for live event demos where NHL teams can see what's possible with Databricks.

## What It Showcases

| Databricks Feature | How It's Used |
|---|---|
| **Databricks Apps** | React + FastAPI full-stack app deployed and managed by Databricks |
| **Delta Lake** | Player stats, standings, schedule, contracts stored as Delta tables with historical snapshots |
| **Unity Catalog** | All tables governed under a 3-layer namespace |
| **Serverless Compute** | Ingestion job runs on serverless - no cluster management |
| **Foundation Model APIs** | AI Assistant powered by Claude Sonnet via pay-per-token serving |
| **Lakebase** | Low-latency Postgres for real-time coach notes on game events |
| **SQL Warehouse** | App queries Delta tables through serverless SQL |
| **Scheduled Jobs** | Data refreshes every 30 minutes automatically |

## Pages

1. **Overview** - Standings (division/conference/league toggle) + upcoming schedule
2. **Roster** - Full team stats, goaltenders, injury report
3. **Contracts & Cap** - 6-year cap outlook, positional breakdown, sortable contracts
4. **Video Review** - Play-by-play events with NHL highlight videos, ice rink visualization, coach notes (Lakebase)
5. **AI Assistant** - Natural language Q&A powered by Databricks Foundation Model APIs

## Data Sources

- **NHL Edge API** (api-web.nhle.com) - Live player stats, standings, schedule, play-by-play
- **Puck Pedia API** - Player contracts, salary cap data
- **Injury data** - Manually maintained via Databricks notebook with form widgets

## Architecture

```
NHL Edge API ──┐                         ┌── Delta Tables (Unity Catalog)
Puck Pedia ────┤── Serverless Job ──────►│    player_stats, standings,
Cap Data ──────┘   (every 30 min)        │    schedule, contracts, game_events
                                         └──────────┐
                                                     ▼
                                              SQL Warehouse
                                                     │
Foundation Model API ◄─── FastAPI Backend ◄──────────┘
                              │       │
                              │       └──► Lakebase (comments)
                              ▼
                        React Frontend
```

## Quick Deploy

### Prerequisites

- Databricks CLI v0.229.0+ (authenticated to target workspace)
- Node.js 18+ and npm
- PostgreSQL client (`brew install postgresql@16`)
- Workspace with: serverless compute, Apps enabled, Foundation Model APIs

### Deploy

```bash
# Clone the repo
git clone <repo-url> && cd nhl-team-analytics

# Authenticate to your workspace
databricks auth login <workspace-url> --profile=my-workspace

# Deploy everything
./deploy.sh --profile my-workspace
```

The script will:
1. Detect your SQL warehouse
2. Create a Lakebase instance
3. Build the React frontend
4. Create Unity Catalog schema and tables
5. Deploy the Databricks App with all resources
6. Grant permissions to the app's service principal
7. Run the initial data ingestion

### Manual Steps After Deploy

1. **Seed injury data** - Open `manage_injuries` notebook, fill out widgets, Run All
2. **Verify** - Visit the app URL printed at the end of deployment

## Project Structure

```
nhl-team-analytics/
├── deploy.sh              # One-command deployment script
├── databricks.yml         # Declarative Automation Bundle config
├── app.yaml               # Databricks App config
├── requirements.txt       # Python dependencies
├── backend/
│   ├── main.py            # FastAPI backend (API routes, AI chat, Lakebase)
│   ├── pyproject.toml     # Python project config
│   └── static/            # Built React frontend (generated)
├── frontend/
│   ├── package.json       # Node dependencies
│   ├── src/
│   │   ├── App.tsx        # Main app with sidebar routing
│   │   ├── types.ts       # TypeScript interfaces
│   │   ├── components/    # Reusable UI components
│   │   └── pages/         # Page-level components
│   └── ...
└── pipeline/
    ├── ingest_nhl_data.py # Data ingestion notebook (scheduled)
    ├── manage_injuries.py # Injury report management (manual)
    └── setup_lakebase.py  # Lakebase setup notebook (one-time)
```

## Customization

### Change the Team

The app defaults to the Colorado Avalanche. To change:

1. Update `TEAM_ABBREV` in `backend/main.py` (e.g., `"NYR"` for Rangers)
2. Update `TEAM` in `pipeline/ingest_nhl_data.py`
3. Update Tailwind colors in `frontend/tailwind.config.js` to match the team's brand
4. Update team name references in `frontend/src/components/Sidebar.tsx` and `TeamHeader.tsx`

### Change the AI Model

Update `MODEL_ENDPOINT` in `backend/main.py` or pass `--model-endpoint` to the deploy script. Any Foundation Model API endpoint works.

## Troubleshooting

| Issue | Fix |
|---|---|
| "Live API" badge instead of "Delta Lake" | SQL warehouse may be stopped, or app SP needs catalog permissions |
| AI returns auth error | Check that the serving endpoint resource is attached to the app |
| Comments fail | Grant Lakebase table permissions to the app's service principal |
| npm install fails | Try `npm install --registry=https://registry.npmmirror.com` |

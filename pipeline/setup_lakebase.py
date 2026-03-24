# Databricks notebook source
# MAGIC %md
# MAGIC # Setup Lakebase for NHL Comments
# MAGIC Creates the `nhl_comments` database and `comments` table.

# COMMAND ----------

# MAGIC %pip install psycopg2-binary

# COMMAND ----------

import psycopg2
import requests
import json

# Get OAuth token for Lakebase
host = dbutils.notebook.entry_point.getDbutils().notebook().getContext().apiUrl().getOrElse(None)
token = dbutils.notebook.entry_point.getDbutils().notebook().getContext().apiToken().getOrElse(None)

# Get Lakebase instance details
resp = requests.get(
    f"{host}/api/2.0/database-instances/nhl-comments",
    headers={"Authorization": f"Bearer {token}"}
)
instance = resp.json()
lakebase_host = instance["read_write_dns"]
print(f"Lakebase host: {lakebase_host}")

# Generate database credential
resp = requests.post(
    f"{host}/api/2.0/database-credentials",
    headers={"Authorization": f"Bearer {token}"},
    json={"request_id": "setup", "instance_names": ["nhl-comments"]}
)
db_token = resp.json()["token"]
print("Got database credential")

# COMMAND ----------

# Create database
conn = psycopg2.connect(host=lakebase_host, port=5432, database="postgres", user="databricks", password=db_token, sslmode="require")
conn.autocommit = True
cur = conn.cursor()
cur.execute("SELECT 1 FROM pg_database WHERE datname = 'nhl_comments'")
if not cur.fetchone():
    cur.execute("CREATE DATABASE nhl_comments")
    print("Created database: nhl_comments")
else:
    print("Database nhl_comments already exists")
cur.close()
conn.close()

# COMMAND ----------

# Create table
conn = psycopg2.connect(host=lakebase_host, port=5432, database="nhl_comments", user="databricks", password=db_token, sslmode="require")
cur = conn.cursor()
cur.execute("""
    CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        game_id BIGINT NOT NULL,
        event_id INT NOT NULL,
        event_type VARCHAR(50),
        event_description TEXT,
        comment_text TEXT NOT NULL,
        author VARCHAR(100) DEFAULT 'Coach',
        created_at TIMESTAMP DEFAULT NOW()
    )
""")
cur.execute("CREATE INDEX IF NOT EXISTS idx_comments_game ON comments(game_id)")
conn.commit()
print("Table 'comments' created with index")

cur.execute("SELECT COUNT(*) FROM comments")
print(f"Current rows: {cur.fetchone()[0]}")
cur.close()
conn.close()
print("Lakebase setup complete!")

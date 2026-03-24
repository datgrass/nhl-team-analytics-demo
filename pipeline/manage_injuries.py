# Databricks notebook source
# MAGIC %md
# MAGIC # Injury Report Manager
# MAGIC Use this notebook to add, update, or remove players from the injury report.
# MAGIC Fill out the widgets at the top and click **Run All**.

# COMMAND ----------

CATALOG = "nhl_demo_catalog"
SCHEMA = "nhl_analytics"
TABLE = f"{CATALOG}.{SCHEMA}.injuries"

# Create table if it doesn't exist
spark.sql(f"""
    CREATE TABLE IF NOT EXISTS {TABLE} (
        name STRING,
        position STRING,
        injury STRING,
        status STRING,
        timeline STRING,
        updated_at TIMESTAMP
    )
""")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Current Injury Report

# COMMAND ----------

display(spark.sql(f"SELECT name, position, injury, status, timeline, updated_at FROM {TABLE} ORDER BY name"))

# COMMAND ----------

# MAGIC %md
# MAGIC ---
# MAGIC ## Add or Update an Injury
# MAGIC Fill out the fields below and run this cell.

# COMMAND ----------

dbutils.widgets.dropdown("action", "Add/Update", ["Add/Update", "Remove", "Clear All"])
dbutils.widgets.text("player_name", "", "Player Name")
dbutils.widgets.dropdown("position", "C", ["C", "LW", "RW", "D", "G"])
dbutils.widgets.text("injury_type", "", "Injury Type (e.g. Upper Body, Knee)")
dbutils.widgets.dropdown("status", "Day-to-Day", ["Day-to-Day", "IR", "LTIR", "Week-to-Week", "Out", "Questionable"])
dbutils.widgets.text("timeline", "", "Timeline (e.g. 2-3 weeks, Indefinite, Questionable)")

# COMMAND ----------

from datetime import datetime, timezone

action = dbutils.widgets.get("action")
player_name = dbutils.widgets.get("player_name").strip()
position = dbutils.widgets.get("position")
injury_type = dbutils.widgets.get("injury_type").strip()
status = dbutils.widgets.get("status")
timeline = dbutils.widgets.get("timeline").strip()
now = datetime.now(timezone.utc).isoformat()

if action == "Clear All":
    spark.sql(f"DELETE FROM {TABLE}")
    print("All injuries cleared.")

elif action == "Remove":
    if not player_name:
        print("ERROR: Enter a player name to remove.")
    else:
        spark.sql(f"DELETE FROM {TABLE} WHERE name = '{player_name}'")
        print(f"Removed {player_name} from injury report.")

elif action == "Add/Update":
    if not player_name or not injury_type:
        print("ERROR: Player Name and Injury Type are required.")
    else:
        # Upsert — remove existing entry for this player, then insert
        spark.sql(f"DELETE FROM {TABLE} WHERE name = '{player_name}'")
        spark.sql(f"""
            INSERT INTO {TABLE} VALUES (
                '{player_name}', '{position}', '{injury_type}',
                '{status}', '{timeline}', '{now}'
            )
        """)
        print(f"{'Updated' if player_name else 'Added'} {player_name}: {injury_type} ({status})")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Updated Injury Report

# COMMAND ----------

display(spark.sql(f"SELECT name, position, injury, status, timeline, updated_at FROM {TABLE} ORDER BY name"))

# COMMAND ----------

# MAGIC %md
# MAGIC ---
# MAGIC ## Update Disclaimer Text
# MAGIC Change the disclaimer message that appears below the injury table in the app.

# COMMAND ----------

spark.sql(f"""
    CREATE TABLE IF NOT EXISTS {CATALOG}.{SCHEMA}.app_config (
        config_key STRING,
        config_value STRING,
        updated_at TIMESTAMP
    )
""")

dbutils.widgets.text("disclaimer", "Injury data is manually maintained and may not reflect the latest updates.", "Disclaimer Text")

# COMMAND ----------

disclaimer = dbutils.widgets.get("disclaimer").strip()
if disclaimer:
    spark.sql(f"DELETE FROM {CATALOG}.{SCHEMA}.app_config WHERE config_key = 'injury_disclaimer'")
    spark.sql(f"""
        INSERT INTO {CATALOG}.{SCHEMA}.app_config VALUES (
            'injury_disclaimer', '{disclaimer}', '{now}'
        )
    """)
    print(f"Disclaimer updated: {disclaimer}")

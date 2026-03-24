# Databricks notebook source
# MAGIC %md
# MAGIC # NHL Data Ingestion Pipeline
# MAGIC Pulls live data from NHL Edge API and Puck Pedia, writes to Delta tables in Unity Catalog.
# MAGIC Runs on serverless compute — no cluster management required.

# COMMAND ----------

import requests
from datetime import datetime, timezone
from pyspark.sql import functions as F
from pyspark.sql.types import *

CATALOG = "nhl_demo_catalog"
SCHEMA = "nhl_analytics"
NHL_API = "https://api-web.nhle.com/v1"
PUCKPEDIA_API = "https://puckpedia.com/api/v2/players"
PUCKPEDIA_KEY = "JokWhjFFF872JK8jf009NHNk"
TEAM = "COL"

spark.sql(f"CREATE SCHEMA IF NOT EXISTS {CATALOG}.{SCHEMA}")

now = datetime.now(timezone.utc)
snapshot_date = now.strftime("%Y-%m-%d")
snapshot_ts = now.isoformat()

# COMMAND ----------

# MAGIC %md
# MAGIC ## 1. Player Stats (Skaters)

# COMMAND ----------

def fetch_json(url, params=None):
    r = requests.get(url, params=params, timeout=15, allow_redirects=True)
    r.raise_for_status()
    return r.json()

stats = fetch_json(f"{NHL_API}/club-stats/{TEAM}/now")

skater_rows = []
for s in stats.get("skaters", []):
    toi = s.get("avgTimeOnIcePerGame", 0) or 0
    skater_rows.append({
        "player_id": s["playerId"],
        "first_name": s["firstName"]["default"],
        "last_name": s["lastName"]["default"],
        "position": s["positionCode"],
        "games_played": s["gamesPlayed"],
        "goals": s["goals"],
        "assists": s["assists"],
        "points": s["points"],
        "plus_minus": s["plusMinus"],
        "penalty_minutes": s["penaltyMinutes"],
        "power_play_goals": s["powerPlayGoals"],
        "shorthanded_goals": s["shorthandedGoals"],
        "game_winning_goals": s["gameWinningGoals"],
        "shots": s["shots"],
        "shooting_pctg": round(s["shootingPctg"] * 100, 1),
        "avg_toi_seconds": round(toi, 1),
        "avg_toi": f"{int(toi // 60)}:{int(toi % 60):02d}" if toi else "0:00",
        "faceoff_win_pctg": round(s.get("faceoffWinPctg", 0) * 100, 1),
        "headshot_url": s.get("headshot", ""),
        "snapshot_date": snapshot_date,
        "ingested_at": snapshot_ts,
    })

df_skaters = spark.createDataFrame(skater_rows)
df_skaters.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(f"{CATALOG}.{SCHEMA}.player_stats_current")

# Append to historical table
df_skaters.write.mode("append").option("mergeSchema", "true").saveAsTable(f"{CATALOG}.{SCHEMA}.player_stats_history")

print(f"Ingested {len(skater_rows)} skaters")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 2. Goalie Stats

# COMMAND ----------

goalie_rows = []
for g in stats.get("goalies", []):
    goalie_rows.append({
        "player_id": g["playerId"],
        "first_name": g["firstName"]["default"],
        "last_name": g["lastName"]["default"],
        "games_played": g["gamesPlayed"],
        "wins": g["wins"],
        "losses": g["losses"],
        "ot_losses": g.get("overtimeLosses", 0),
        "gaa": round(g["goalsAgainstAverage"], 3),
        "save_pctg": round(g["savePercentage"] * 100, 1),
        "shutouts": g["shutouts"],
        "goals_against": g.get("goalsAgainst", 0),
        "saves": g.get("saves", 0),
        "shots_against": g.get("shotsAgainst", 0),
        "headshot_url": g.get("headshot", ""),
        "snapshot_date": snapshot_date,
        "ingested_at": snapshot_ts,
    })

df_goalies = spark.createDataFrame(goalie_rows)
df_goalies.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(f"{CATALOG}.{SCHEMA}.goalie_stats_current")
df_goalies.write.mode("append").option("mergeSchema", "true").saveAsTable(f"{CATALOG}.{SCHEMA}.goalie_stats_history")

print(f"Ingested {len(goalie_rows)} goalies")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 3. Standings

# COMMAND ----------

standings = fetch_json(f"{NHL_API}/standings/now")

standing_rows = []
for t in standings.get("standings", []):
    standing_rows.append({
        "team_abbrev": t["teamAbbrev"]["default"],
        "team_name": t["teamName"]["default"],
        "team_logo": t.get("teamLogo", ""),
        "division": t["divisionAbbrev"],
        "conference": t["conferenceName"],
        "games_played": t["gamesPlayed"],
        "wins": t["wins"],
        "losses": t["losses"],
        "ot_losses": t["otLosses"],
        "points": t["points"],
        "point_pctg": round(t["pointPctg"] * 100, 1),
        "goals_for": t["goalFor"],
        "goals_against": t["goalAgainst"],
        "goal_diff": t["goalDifferential"],
        "division_rank": t["divisionSequence"],
        "conference_rank": t["conferenceSequence"],
        "streak_code": t["streakCode"],
        "streak_count": t["streakCount"],
        "l10_wins": t["l10Wins"],
        "l10_losses": t["l10Losses"],
        "l10_ot_losses": t["l10OtLosses"],
        "snapshot_date": snapshot_date,
        "ingested_at": snapshot_ts,
    })

df_standings = spark.createDataFrame(standing_rows)
df_standings.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(f"{CATALOG}.{SCHEMA}.standings_current")
df_standings.write.mode("append").option("mergeSchema", "true").saveAsTable(f"{CATALOG}.{SCHEMA}.standings_history")

print(f"Ingested {len(standing_rows)} team standings")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 4. Schedule

# COMMAND ----------

schedule = fetch_json(f"{NHL_API}/club-schedule-season/{TEAM}/now")

game_rows = []
for g in schedule.get("games", []):
    ot = g.get("gameOutcome", {}).get("lastPeriodType", "REG") if g.get("gameOutcome") else "REG"
    game_rows.append({
        "game_id": g["id"],
        "game_date": g["gameDate"],
        "start_time_utc": g["startTimeUTC"],
        "game_state": g["gameState"],
        "home_team": g["homeTeam"]["abbrev"],
        "home_logo": g["homeTeam"].get("logo", ""),
        "home_score": g["homeTeam"].get("score"),
        "away_team": g["awayTeam"]["abbrev"],
        "away_logo": g["awayTeam"].get("logo", ""),
        "away_score": g["awayTeam"].get("score"),
        "period_type": ot,
        "is_home": g["homeTeam"]["abbrev"] == TEAM,
        "ingested_at": snapshot_ts,
    })

df_schedule = spark.createDataFrame(game_rows)
df_schedule.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(f"{CATALOG}.{SCHEMA}.schedule")

print(f"Ingested {len(game_rows)} games")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 5. Player Contracts (Puck Pedia)

# COMMAND ----------

contracts_raw = fetch_json(PUCKPEDIA_API, params={"api_key": PUCKPEDIA_KEY})

contract_rows = []
for p in contracts_raw:
    if not p.get("current"):
        continue
    for c in p["current"]:
        current_year = None
        for y in c.get("years", []):
            if y.get("season") == "2025-2026":
                current_year = y
                break
        if not current_year and c.get("years"):
            current_year = c["years"][0]

        cap_hit = float(current_year["cap_hit"]) if current_year and current_year.get("cap_hit") else 0
        aav = float(current_year["aav"]) if current_year and current_year.get("aav") else 0

        if cap_hit <= 0:
            continue

        contract_rows.append({
            "player_id": p["player_id"],
            "first_name": p["first_name"],
            "last_name": p["last_name"],
            "position": p["position"],
            "position_detail": p.get("position_detail", ""),
            "jersey_number": p.get("jersey_number", ""),
            "nhl_games": p.get("nhl_games", 0),
            "cap_hit": cap_hit,
            "aav": aav,
            "contract_type": c.get("contract_type", ""),
            "contract_length": c.get("length", 0),
            "contract_end": c.get("contract_end", ""),
            "expiry_status": c.get("expiry_status", ""),
            "signing_status": c.get("signing_status", ""),
            "total_value": float(c["value"]) if c.get("value") else 0,
            "ingested_at": snapshot_ts,
        })

df_contracts = spark.createDataFrame(contract_rows)
df_contracts.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(f"{CATALOG}.{SCHEMA}.contracts")

print(f"Ingested {len(contract_rows)} contracts")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 6. Cap Projections

# COMMAND ----------

cap_seasons = [
    {"season": "2025-2026", "salary_cap": 95500000, "projected_cap_hit": 94994375, "projected_cap_space": 505625, "cap_hit_forwards": 65787500, "cap_hit_defence": 26675000, "cap_hit_goalies": 6750000, "roster_count": 24, "contracts": 48, "ltir": 2122151},
    {"season": "2026-2027", "salary_cap": 104000000, "projected_cap_hit": 99600000, "projected_cap_space": 4400000, "cap_hit_forwards": 66900000, "cap_hit_defence": 24950000, "cap_hit_goalies": 7750000, "roster_count": 18, "contracts": 30, "ltir": 0},
    {"season": "2027-2028", "salary_cap": 113500000, "projected_cap_hit": 76600000, "projected_cap_space": 36900000, "cap_hit_forwards": 55400000, "cap_hit_defence": 15950000, "cap_hit_goalies": 5250000, "roster_count": 13, "contracts": 15, "ltir": 0},
    {"season": "2028-2029", "salary_cap": 123000000, "projected_cap_hit": 64275000, "projected_cap_space": 58725000, "cap_hit_forwards": 47025000, "cap_hit_defence": 12000000, "cap_hit_goalies": 5250000, "roster_count": 10, "contracts": 10, "ltir": 0},
    {"season": "2029-2030", "salary_cap": 113500000, "projected_cap_hit": 51675000, "projected_cap_space": 61825000, "cap_hit_forwards": 34425000, "cap_hit_defence": 12000000, "cap_hit_goalies": 5250000, "roster_count": 8, "contracts": 8, "ltir": 0},
    {"season": "2030-2031", "salary_cap": 113500000, "projected_cap_hit": 33850000, "projected_cap_space": 79650000, "cap_hit_forwards": 26600000, "cap_hit_defence": 7250000, "cap_hit_goalies": 0, "roster_count": 4, "contracts": 4, "ltir": 0},
]

for c in cap_seasons:
    c["ingested_at"] = snapshot_ts

df_cap = spark.createDataFrame(cap_seasons)
df_cap.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(f"{CATALOG}.{SCHEMA}.cap_projections")

print(f"Ingested {len(cap_seasons)} cap projection seasons")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 7. Play-by-Play Events (Last 5 completed games)

# COMMAND ----------

completed = [g for g in schedule.get("games", []) if g.get("gameState") in ("FINAL", "OFF")]
recent_games = completed[-5:]

all_events = []
for game in recent_games:
    gid = game["id"]
    try:
        pbp = fetch_json(f"{NHL_API}/gamecenter/{gid}/play-by-play")
    except Exception as e:
        print(f"Skipping game {gid}: {e}")
        continue

    # Build player name map
    player_map = {}
    for p in pbp.get("rosterSpots", []):
        player_map[p["playerId"]] = f"{p['firstName']['default']} {p['lastName']['default']}"

    home_team = pbp.get("homeTeam", {})
    away_team = pbp.get("awayTeam", {})

    for play in pbp.get("plays", []):
        evt = play.get("typeDescKey", "")
        if evt not in ("goal", "shot-on-goal", "hit", "penalty", "takeaway", "giveaway", "blocked-shot"):
            continue

        d = play.get("details", {})
        period = play.get("periodDescriptor", {})

        all_events.append({
            "game_id": gid,
            "game_date": game["gameDate"],
            "home_team": game["homeTeam"]["abbrev"],
            "away_team": game["awayTeam"]["abbrev"],
            "event_id": play.get("eventId", 0),
            "event_type": evt,
            "time_in_period": play.get("timeInPeriod", ""),
            "time_remaining": play.get("timeRemaining", ""),
            "period_number": period.get("number", 0),
            "period_type": period.get("periodType", ""),
            "x_coord": d.get("xCoord"),
            "y_coord": d.get("yCoord"),
            "zone_code": d.get("zoneCode", ""),
            "shot_type": d.get("shotType", ""),
            "event_owner_team_id": d.get("eventOwnerTeamId"),
            "scoring_player": player_map.get(d.get("scoringPlayerId"), ""),
            "shooting_player": player_map.get(d.get("shootingPlayerId"), ""),
            "assist1_player": player_map.get(d.get("assist1PlayerId"), ""),
            "assist2_player": player_map.get(d.get("assist2PlayerId"), ""),
            "hitting_player": player_map.get(d.get("hittingPlayerId"), ""),
            "hittee_player": player_map.get(d.get("hitteePlayerId"), ""),
            "penalty_player": player_map.get(d.get("committedByPlayerId"), ""),
            "penalty_desc": d.get("descKey", ""),
            "penalty_duration": d.get("duration"),
            "away_score": d.get("awayScore"),
            "home_score": d.get("homeScore"),
            "highlight_url": d.get("highlightClipSharingUrl", ""),
            "situation_code": play.get("situationCode", ""),
            "ingested_at": snapshot_ts,
        })

if all_events:
    df_events = spark.createDataFrame(all_events)
    df_events.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(f"{CATALOG}.{SCHEMA}.game_events")
    print(f"Ingested {len(all_events)} events from {len(recent_games)} games")
else:
    print("No events to ingest")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Summary

# COMMAND ----------

tables = spark.sql(f"SHOW TABLES IN {CATALOG}.{SCHEMA}").collect()
print(f"\n{'='*50}")
print(f"NHL Data Ingestion Complete — {snapshot_ts}")
print(f"{'='*50}")
for t in tables:
    count = spark.sql(f"SELECT COUNT(*) as cnt FROM {CATALOG}.{SCHEMA}.{t.tableName}").collect()[0].cnt
    print(f"  {t.tableName}: {count:,} rows")
print(f"{'='*50}")

"""NHL Team Analytics - FastAPI Backend"""
import json as jsonlib
import os
import time
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path

app = FastAPI(title="NHL Team Analytics API")

# Databricks config
_raw_host = os.getenv("DATABRICKS_HOST", "")
DATABRICKS_HOST = _raw_host if _raw_host.startswith("http") else f"https://{_raw_host}"
SQL_WAREHOUSE_ID = os.getenv("DATABRICKS_WAREHOUSE_ID", "c6b1b633e4072e67")
CATALOG = "nhl_demo_catalog"
SCHEMA = "nhl_analytics"
DATABRICKS_CLIENT_ID = os.getenv("DATABRICKS_CLIENT_ID", "")
DATABRICKS_CLIENT_SECRET = os.getenv("DATABRICKS_CLIENT_SECRET", "")
LAKEBASE_HOST = os.getenv("LAKEBASE_HOST", "ep-autumn-tooth-d8ze9bdj.database.us-east-2.cloud.databricks.com")
LAKEBASE_DB = "nhl_comments"

_token_cache: dict = {"token": "", "expires_at": 0}


async def get_databricks_token() -> str:
    """Get an OAuth token using the app's service principal credentials."""
    if _token_cache["token"] and _token_cache["expires_at"] > time.time() + 60:
        return _token_cache["token"]

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{DATABRICKS_HOST}/oidc/v1/token",
            data={
                "grant_type": "client_credentials",
                "client_id": DATABRICKS_CLIENT_ID,
                "client_secret": DATABRICKS_CLIENT_SECRET,
                "scope": "all-apis",
            },
        )
        resp.raise_for_status()
        data = resp.json()
        _token_cache["token"] = data["access_token"]
        _token_cache["expires_at"] = time.time() + data.get("expires_in", 3600)
        return _token_cache["token"]
MODEL_ENDPOINT = "databricks-claude-sonnet-4-5"


async def execute_sql(query: str) -> list[dict]:
    """Execute SQL against the Databricks SQL warehouse and return rows as dicts."""
    token = await get_databricks_token()
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        # Submit statement
        resp = await client.post(
            f"{DATABRICKS_HOST}/api/2.0/sql/statements",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "warehouse_id": SQL_WAREHOUSE_ID,
                "statement": query,
                "wait_timeout": "30s",
                "disposition": "INLINE",
                "format": "JSON_ARRAY",
            },
        )
        resp.raise_for_status()
        data = resp.json()

        status = data.get("status", {}).get("state", "")
        if status == "FAILED":
            raise Exception(data.get("status", {}).get("error", {}).get("message", "SQL error"))

        # Wait for completion if pending
        stmt_id = data.get("statement_id")
        import asyncio
        for _ in range(30):
            if status in ("SUCCEEDED",):
                break
            if status in ("FAILED", "CANCELED", "CLOSED"):
                raise Exception(f"SQL statement {status}")
            await asyncio.sleep(1)
            poll = await client.get(
                f"{DATABRICKS_HOST}/api/2.0/sql/statements/{stmt_id}",
                headers={"Authorization": f"Bearer {token}"},
            )
            data = poll.json()
            status = data.get("status", {}).get("state", "")

        # Parse results
        result = data.get("result", {})
        columns = [c["name"] for c in data.get("manifest", {}).get("schema", {}).get("columns", [])]
        rows = result.get("data_array", [])
        return [dict(zip(columns, row)) for row in rows]


NHL_API_BASE = "https://api-web.nhle.com/v1"
PUCKPEDIA_API = "https://puckpedia.com/api/v2/players"
PUCKPEDIA_API_KEY = os.getenv("PUCKPEDIA_API_KEY", "JokWhjFFF872JK8jf009NHNk")

# Colorado Avalanche
TEAM_ABBREV = "COL"
NHL_TEAM_ID = 21

# Cap data from Puck Pedia team API (provided inline)
CAP_SEASONS = [
    {
        "season": "2025-2026",
        "salary_cap": 95500000,
        "current_roster_annual_cap_hit": 99212500,
        "projected_cap_hit": 94994375,
        "projected_cap_space": 505625,
        "current_cap_space": 3236000,
        "cap_hit_forwards": 65787500,
        "cap_hit_defence": 26675000,
        "cap_hit_goalies": 6750000,
        "roster_count": 24,
        "contracts": 48,
        "ltir": 2122151,
    },
    {
        "season": "2026-2027",
        "salary_cap": 104000000,
        "current_roster_annual_cap_hit": 99600000,
        "projected_cap_hit": 99600000,
        "projected_cap_space": 4400000,
        "current_cap_space": 4400000,
        "cap_hit_forwards": 66900000,
        "cap_hit_defence": 24950000,
        "cap_hit_goalies": 7750000,
        "roster_count": 18,
        "contracts": 30,
        "ltir": 0,
    },
    {
        "season": "2027-2028",
        "salary_cap": 113500000,
        "current_roster_annual_cap_hit": 76600000,
        "projected_cap_hit": 76600000,
        "projected_cap_space": 36900000,
        "current_cap_space": 36900000,
        "cap_hit_forwards": 55400000,
        "cap_hit_defence": 15950000,
        "cap_hit_goalies": 5250000,
        "roster_count": 13,
        "contracts": 15,
        "ltir": 0,
    },
    {
        "season": "2028-2029",
        "salary_cap": 123000000,
        "current_roster_annual_cap_hit": 64275000,
        "projected_cap_hit": 64275000,
        "projected_cap_space": 58725000,
        "current_cap_space": 58725000,
        "cap_hit_forwards": 47025000,
        "cap_hit_defence": 12000000,
        "cap_hit_goalies": 5250000,
        "roster_count": 10,
        "contracts": 10,
        "ltir": 0,
    },
    {
        "season": "2029-2030",
        "salary_cap": 113500000,
        "current_roster_annual_cap_hit": 51675000,
        "projected_cap_hit": 51675000,
        "projected_cap_space": 61825000,
        "current_cap_space": 61825000,
        "cap_hit_forwards": 34425000,
        "cap_hit_defence": 12000000,
        "cap_hit_goalies": 5250000,
        "roster_count": 8,
        "contracts": 8,
        "ltir": 0,
    },
    {
        "season": "2030-2031",
        "salary_cap": 113500000,
        "current_roster_annual_cap_hit": 33850000,
        "projected_cap_hit": 33850000,
        "projected_cap_space": 79650000,
        "current_cap_space": 79650000,
        "cap_hit_forwards": 26600000,
        "cap_hit_defence": 7250000,
        "cap_hit_goalies": 0,
        "roster_count": 4,
        "contracts": 4,
        "ltir": 0,
    },
]


async def fetch_json(url: str, params: dict | None = None) -> dict:
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        return resp.json()


def _int(v):
    try: return int(v)
    except: return 0

def _float(v):
    try: return float(v)
    except: return 0.0

def transform_skater(r: dict) -> dict:
    """Transform Delta snake_case row to NHL API camelCase format."""
    return {
        "playerId": _int(r.get("player_id")),
        "headshot": r.get("headshot_url", ""),
        "firstName": {"default": r.get("first_name", "")},
        "lastName": {"default": r.get("last_name", "")},
        "positionCode": r.get("position", ""),
        "gamesPlayed": _int(r.get("games_played")),
        "goals": _int(r.get("goals")),
        "assists": _int(r.get("assists")),
        "points": _int(r.get("points")),
        "plusMinus": _int(r.get("plus_minus")),
        "penaltyMinutes": _int(r.get("penalty_minutes")),
        "powerPlayGoals": _int(r.get("power_play_goals")),
        "shorthandedGoals": _int(r.get("shorthanded_goals")),
        "gameWinningGoals": _int(r.get("game_winning_goals")),
        "shots": _int(r.get("shots")),
        "shootingPctg": _float(r.get("shooting_pctg", 0)) / 100,
        "avgTimeOnIcePerGame": _float(r.get("avg_toi_seconds")),
        "faceoffWinPctg": _float(r.get("faceoff_win_pctg", 0)) / 100,
    }

def transform_goalie(r: dict) -> dict:
    """Transform Delta snake_case row to NHL API camelCase format."""
    return {
        "playerId": _int(r.get("player_id")),
        "headshot": r.get("headshot_url", ""),
        "firstName": {"default": r.get("first_name", "")},
        "lastName": {"default": r.get("last_name", "")},
        "gamesPlayed": _int(r.get("games_played")),
        "wins": _int(r.get("wins")),
        "losses": _int(r.get("losses")),
        "overtimeLosses": _int(r.get("ot_losses")),
        "goalsAgainstAverage": _float(r.get("gaa")),
        "savePercentage": _float(r.get("save_pctg", 0)) / 100,
        "shutouts": _int(r.get("shutouts")),
        "timeOnIce": _int(r.get("time_on_ice", 0)),
    }


@app.get("/api/stats")
async def get_player_stats():
    """Player stats — tries Delta tables first, falls back to live API."""
    delta_error = None
    try:
        skaters_raw = await execute_sql(f"SELECT * FROM {CATALOG}.{SCHEMA}.player_stats_current ORDER BY CAST(points AS INT) DESC")
        goalies_raw = await execute_sql(f"SELECT * FROM {CATALOG}.{SCHEMA}.goalie_stats_current ORDER BY CAST(wins AS INT) DESC")
        if skaters_raw:
            skaters = [transform_skater(r) for r in skaters_raw]
            goalies = [transform_goalie(r) for r in goalies_raw]
            return {"skaters": skaters, "goalies": goalies, "source": "databricks"}
    except Exception as e:
        delta_error = str(e)

    # Fallback to live API
    try:
        data = await fetch_json(f"{NHL_API_BASE}/club-stats/{TEAM_ABBREV}/now")
        skaters = sorted(data.get("skaters", []), key=lambda x: x.get("points", 0), reverse=True)
        goalies = data.get("goalies", [])
        return {"skaters": skaters, "goalies": goalies, "source": "nhl_api", "delta_error": delta_error}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Both sources failed. Delta: {delta_error}. NHL API: {e}")


@app.get("/api/debug")
async def debug():
    """Debug endpoint to test connectivity."""
    results = {}
    try:
        data = await fetch_json(f"{NHL_API_BASE}/club-stats/{TEAM_ABBREV}/now")
        results["nhl_api"] = f"OK - {len(data.get('skaters',[]))} skaters"
    except Exception as e:
        results["nhl_api"] = f"ERROR: {e}"
    try:
        rows = await execute_sql(f"SELECT COUNT(*) as cnt FROM {CATALOG}.{SCHEMA}.player_stats_current")
        results["delta"] = f"OK - {rows[0]['cnt']} rows"
    except Exception as e:
        results["delta"] = f"ERROR: {e}"
    results["host"] = DATABRICKS_HOST
    results["warehouse"] = SQL_WAREHOUSE_ID
    results["client_id"] = DATABRICKS_CLIENT_ID[:8] + "..." if DATABRICKS_CLIENT_ID else "missing"
    return results


@app.get("/api/roster")
async def get_roster():
    """Full roster with headshots from NHL Edge API."""
    try:
        data = await fetch_json(f"{NHL_API_BASE}/roster/{TEAM_ABBREV}/current")
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NHL API error: {e}")


@app.get("/api/schedule")
async def get_schedule():
    """Schedule — tries Delta first, falls back to live API."""
    try:
        rows = await execute_sql(f"SELECT * FROM {CATALOG}.{SCHEMA}.schedule ORDER BY start_time_utc")
        if rows:
            # Transform to match frontend expected format
            games = []
            for r in rows:
                games.append({
                    "id": int(r["game_id"]),
                    "gameDate": r["game_date"],
                    "startTimeUTC": r["start_time_utc"],
                    "gameState": r["game_state"],
                    "homeTeam": {"abbrev": r["home_team"], "logo": r["home_logo"], "score": int(r["home_score"]) if r["home_score"] is not None else None},
                    "awayTeam": {"abbrev": r["away_team"], "logo": r["away_logo"], "score": int(r["away_score"]) if r["away_score"] is not None else None},
                    "gameOutcome": {"lastPeriodType": r.get("period_type", "REG")},
                })
            return {"games": games, "source": "databricks"}
    except Exception:
        pass

    try:
        data = await fetch_json(f"{NHL_API_BASE}/club-schedule-season/{TEAM_ABBREV}/now")
        data["source"] = "nhl_api"
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NHL API error: {e}")


@app.get("/api/standings")
async def get_standings():
    """Standings — tries Delta first, falls back to live API."""
    try:
        rows = await execute_sql(f"SELECT * FROM {CATALOG}.{SCHEMA}.standings_current ORDER BY points DESC")
        if rows:
            standings = []
            for r in rows:
                standings.append({
                    "teamAbbrev": {"default": r["team_abbrev"]},
                    "teamName": {"default": r["team_name"]},
                    "teamLogo": r["team_logo"],
                    "divisionAbbrev": r["division"],
                    "conferenceName": r["conference"],
                    "gamesPlayed": int(r["games_played"]),
                    "wins": int(r["wins"]),
                    "losses": int(r["losses"]),
                    "otLosses": int(r["ot_losses"]),
                    "points": int(r["points"]),
                    "pointPctg": float(r["point_pctg"]) / 100,
                    "goalFor": int(r["goals_for"]),
                    "goalAgainst": int(r["goals_against"]),
                    "goalDifferential": int(r["goal_diff"]),
                    "divisionSequence": int(r["division_rank"]),
                    "conferenceSequence": int(r["conference_rank"]),
                    "streakCode": r["streak_code"],
                    "streakCount": int(r["streak_count"]),
                    "l10Wins": int(r["l10_wins"]),
                    "l10Losses": int(r["l10_losses"]),
                    "l10OtLosses": int(r["l10_ot_losses"]),
                })
            return {"standings": standings, "source": "databricks"}
    except Exception:
        pass

    try:
        data = await fetch_json(f"{NHL_API_BASE}/standings/now")
        data["source"] = "nhl_api"
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NHL API error: {e}")


@app.get("/api/contracts")
async def get_contracts():
    """Contracts — tries Delta first, falls back to live API."""
    try:
        rows = await execute_sql(f"SELECT * FROM {CATALOG}.{SCHEMA}.contracts ORDER BY CAST(cap_hit AS DOUBLE) DESC")
        if rows:
            # Transform flat Delta rows to Puck Pedia nested format for frontend
            contracts = []
            for r in rows:
                contracts.append({
                    "player_id": r.get("player_id", ""),
                    "first_name": r.get("first_name", ""),
                    "last_name": r.get("last_name", ""),
                    "position": r.get("position", ""),
                    "position_detail": r.get("position_detail", ""),
                    "jersey_number": r.get("jersey_number", ""),
                    "nhl_games": _int(r.get("nhl_games")),
                    "current": [{
                        "contract_type": r.get("contract_type", ""),
                        "length": _int(r.get("contract_length")),
                        "value": r.get("total_value", "0"),
                        "signing_status": r.get("signing_status", ""),
                        "contract_end": r.get("contract_end", ""),
                        "expiry_status": r.get("expiry_status", ""),
                        "years": [{
                            "season": "2025-2026",
                            "cap_hit": r.get("cap_hit", "0"),
                            "aav": r.get("aav", "0"),
                            "base_salary": r.get("cap_hit", "0"),
                        }],
                    }],
                })
            return contracts
    except Exception:
        pass

    try:
        data = await fetch_json(PUCKPEDIA_API, params={"api_key": PUCKPEDIA_API_KEY})
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Puck Pedia API error: {e}")


@app.get("/api/cap")
async def get_cap_data():
    """Cap projections — tries Delta first, falls back to hardcoded."""
    try:
        rows = await execute_sql(f"SELECT * FROM {CATALOG}.{SCHEMA}.cap_projections ORDER BY season")
        if rows:
            seasons = []
            for r in rows:
                seasons.append({
                    "season": r["season"],
                    "salary_cap": _int(r.get("salary_cap")),
                    "current_roster_annual_cap_hit": _int(r.get("projected_cap_hit")),
                    "projected_cap_hit": _int(r.get("projected_cap_hit")),
                    "projected_cap_space": _int(r.get("projected_cap_space")),
                    "current_cap_space": _int(r.get("projected_cap_space")),
                    "cap_hit_forwards": _int(r.get("cap_hit_forwards")),
                    "cap_hit_defence": _int(r.get("cap_hit_defence")),
                    "cap_hit_goalies": _int(r.get("cap_hit_goalies")),
                    "roster_count": _int(r.get("roster_count")),
                    "contracts": _int(r.get("contracts")),
                    "ltir": _int(r.get("ltir")),
                })
            return {"team": "Colorado Avalanche", "seasons": seasons, "source": "databricks"}
    except Exception:
        pass

    return {"team": "Colorado Avalanche", "seasons": CAP_SEASONS, "source": "hardcoded"}


@app.get("/api/pipeline-status")
async def get_pipeline_status():
    """Check the status of the data pipeline — when was data last refreshed."""
    try:
        rows = await execute_sql(f"SELECT MAX(ingested_at) as last_ingested FROM {CATALOG}.{SCHEMA}.player_stats_current")
        if rows and rows[0].get("last_ingested"):
            return {"status": "active", "last_ingested": rows[0]["last_ingested"], "source": "databricks"}
    except Exception:
        pass
    return {"status": "inactive", "last_ingested": None, "source": "live_api"}


@app.get("/api/injuries")
async def get_injuries():
    """Injury report from Delta table."""
    injuries = []
    disclaimer = "Injury data is manually maintained and may not reflect the latest updates."
    try:
        rows = await execute_sql(f"SELECT * FROM {CATALOG}.{SCHEMA}.injuries ORDER BY name")
        injuries = rows

        config = await execute_sql(f"SELECT config_value FROM {CATALOG}.{SCHEMA}.app_config WHERE config_key = 'injury_disclaimer'")
        if config and config[0].get("config_value"):
            disclaimer = config[0]["config_value"]
    except Exception:
        pass

    return {"injuries": injuries, "disclaimer": disclaimer}


def _get_token_sync() -> str:
    """Get OAuth token synchronously using httpx sync client."""
    import time
    if _token_cache["token"] and _token_cache["expires_at"] > time.time() + 60:
        return _token_cache["token"]

    resp = httpx.post(
        f"{DATABRICKS_HOST}/oidc/v1/token",
        data={
            "grant_type": "client_credentials",
            "client_id": DATABRICKS_CLIENT_ID,
            "client_secret": DATABRICKS_CLIENT_SECRET,
            "scope": "all-apis",
        },
        timeout=10.0,
    )
    resp.raise_for_status()
    data = resp.json()
    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = time.time() + data.get("expires_in", 3600)
    return _token_cache["token"]


def get_lakebase_conn():
    """Get a Postgres connection to Lakebase."""
    import psycopg2
    pg_host = os.getenv("PGHOST", LAKEBASE_HOST)
    pg_port = os.getenv("PGPORT", "5432")
    pg_db = os.getenv("PGDATABASE", LAKEBASE_DB)
    pg_user = os.getenv("PGUSER", DATABRICKS_CLIENT_ID)
    pg_ssl = os.getenv("PGSSLMODE", "require")
    pg_pass = os.getenv("PGPASSWORD", "")

    if not pg_pass:
        pg_pass = _get_token_sync()

    return psycopg2.connect(
        host=pg_host,
        port=int(pg_port),
        database=pg_db,
        user=pg_user,
        password=pg_pass,
        sslmode=pg_ssl,
    )


_lakebase_initialized = False


def ensure_lakebase_tables():
    """Create the comments table if it doesn't exist."""
    global _lakebase_initialized
    if _lakebase_initialized:
        return
    try:
        conn = get_lakebase_conn()
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
        cur.close()
        conn.close()
        _lakebase_initialized = True
    except Exception as e:
        print(f"Lakebase init error: {e}")


class CommentRequest(BaseModel):
    game_id: int
    event_id: int
    event_type: str = ""
    event_description: str = ""
    comment_text: str
    author: str = "Coach"


@app.get("/api/comments/{game_id}")
async def get_comments(game_id: int):
    """Get all comments for a game from Lakebase."""
    try:
        ensure_lakebase_tables()
        conn = get_lakebase_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, game_id, event_id, event_type, event_description, comment_text, author, created_at "
            "FROM comments WHERE game_id = %s ORDER BY created_at DESC",
            (game_id,),
        )
        columns = [desc[0] for desc in cur.description]
        rows = [dict(zip(columns, row)) for row in cur.fetchall()]
        # Convert datetime to string
        for r in rows:
            if r.get("created_at"):
                r["created_at"] = r["created_at"].isoformat()
        cur.close()
        conn.close()
        return {"comments": rows, "source": "lakebase"}
    except Exception as e:
        return {"comments": [], "source": "error", "detail": str(e)}


@app.post("/api/comments")
async def add_comment(req: CommentRequest):
    """Add a comment to a game event, stored in Lakebase."""
    if not req.comment_text.strip():
        raise HTTPException(status_code=400, detail="Comment text is required")
    try:
        ensure_lakebase_tables()
        conn = get_lakebase_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO comments (game_id, event_id, event_type, event_description, comment_text, author) "
            "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, created_at",
            (req.game_id, req.event_id, req.event_type, req.event_description, req.comment_text, req.author),
        )
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return {"id": result[0], "created_at": result[1].isoformat(), "source": "lakebase"}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Lakebase error: {e}")


@app.delete("/api/comments/{comment_id}")
async def delete_comment(comment_id: int):
    """Delete a comment from Lakebase."""
    try:
        conn = get_lakebase_conn()
        cur = conn.cursor()
        cur.execute("DELETE FROM comments WHERE id = %s", (comment_id,))
        conn.commit()
        cur.close()
        conn.close()
        return {"deleted": comment_id}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Lakebase error: {e}")


class CommentUpdate(BaseModel):
    comment_text: str


@app.patch("/api/comments/{comment_id}")
async def update_comment(comment_id: int, req: CommentUpdate):
    """Update a comment's text in Lakebase."""
    if not req.comment_text.strip():
        raise HTTPException(status_code=400, detail="Comment text is required")
    try:
        conn = get_lakebase_conn()
        cur = conn.cursor()
        cur.execute("UPDATE comments SET comment_text = %s WHERE id = %s", (req.comment_text.strip(), comment_id))
        conn.commit()
        cur.close()
        conn.close()
        return {"updated": comment_id}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Lakebase error: {e}")


@app.get("/api/games")
async def get_completed_games():
    """Recent completed games for video review game selector."""
    try:
        data = await fetch_json(f"{NHL_API_BASE}/club-schedule-season/{TEAM_ABBREV}/now")
        games = data.get("games", [])
        completed = [
            g for g in games
            if g.get("gameState") in ("FINAL", "OFF")
        ]
        # Return last 20 completed games (most recent first)
        return completed[-20:][::-1]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NHL API error: {e}")


@app.get("/api/game/{game_id}/play-by-play")
async def get_play_by_play(game_id: int):
    """Play-by-play events for a specific game."""
    try:
        data = await fetch_json(f"{NHL_API_BASE}/gamecenter/{game_id}/play-by-play")
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NHL API error: {e}")


@app.get("/api/game/{game_id}/landing")
async def get_game_landing(game_id: int):
    """Game landing page data (summary, scoring, penalties)."""
    try:
        data = await fetch_json(f"{NHL_API_BASE}/gamecenter/{game_id}/landing")
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NHL API error: {e}")


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


async def gather_context() -> str:
    """Fetch live data to give the AI context about the team."""
    ctx_parts = []
    try:
        stats = await fetch_json(f"{NHL_API_BASE}/club-stats/{TEAM_ABBREV}/now")
        skaters = sorted(stats.get("skaters", []), key=lambda x: x.get("points", 0), reverse=True)
        top_skaters = []
        for s in skaters[:20]:
            toi = s.get("avgTimeOnIcePerGame", 0)
            toi_str = f"{int(toi // 60)}:{int(toi % 60):02d}" if toi else "N/A"
            top_skaters.append(
                f"  {s['firstName']['default']} {s['lastName']['default']} ({s['positionCode']}): "
                f"{s['goals']}G {s['assists']}A {s['points']}PTS, +/-:{s['plusMinus']}, "
                f"PPG:{s['powerPlayGoals']}, SOG:{s['shots']}, TOI:{toi_str}"
            )
        ctx_parts.append("SKATER STATS (top 20 by points):\n" + "\n".join(top_skaters))

        goalies = stats.get("goalies", [])
        for g in goalies:
            svpct = g.get("savePercentage", 0)
            ctx_parts.append(
                f"GOALIE: {g['firstName']['default']} {g['lastName']['default']}: "
                f"{g['wins']}W-{g['losses']}L-{g.get('overtimeLosses', 0)}OTL, "
                f"GAA:{g['goalsAgainstAverage']:.2f}, SV%:{svpct * 100:.1f}%, SO:{g['shutouts']}"
            )
    except Exception:
        pass

    try:
        standings = await fetch_json(f"{NHL_API_BASE}/standings/now")
        all_teams = standings.get("standings", [])
        col = next((t for t in all_teams if t.get("teamAbbrev", {}).get("default") == "COL"), None)
        if col:
            ctx_parts.append(
                f"STANDINGS: COL is {col['wins']}W-{col['losses']}L-{col['otLosses']}OTL, "
                f"{col['points']} PTS, Division rank: {col['divisionSequence']}, "
                f"Conference rank: {col['conferenceSequence']}, "
                f"Streak: {col['streakCode']}{col['streakCount']}, "
                f"L10: {col['l10Wins']}-{col['l10Losses']}-{col['l10OtLosses']}, "
                f"GF:{col['goalFor']} GA:{col['goalAgainst']} DIFF:{col['goalDifferential']}"
            )
    except Exception:
        pass

    try:
        schedule = await fetch_json(f"{NHL_API_BASE}/club-schedule-season/{TEAM_ABBREV}/now")
        games = schedule.get("games", [])
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        upcoming = [g for g in games if datetime.fromisoformat(g["startTimeUTC"].replace("Z", "+00:00")) > now][:8]
        recent = [g for g in games if g.get("gameState") in ("FINAL", "OFF")][-5:]

        if upcoming:
            sched_lines = []
            for g in upcoming:
                dt = datetime.fromisoformat(g["startTimeUTC"].replace("Z", "+00:00"))
                is_home = g["homeTeam"]["abbrev"] == "COL"
                opp = g["awayTeam"]["abbrev"] if is_home else g["homeTeam"]["abbrev"]
                prefix = "vs" if is_home else "@"
                sched_lines.append(f"  {dt.strftime('%a %b %d %I:%M %p')} UTC - {prefix} {opp}")
            ctx_parts.append("UPCOMING GAMES:\n" + "\n".join(sched_lines))

        if recent:
            recent_lines = []
            for g in recent:
                dt = datetime.fromisoformat(g["startTimeUTC"].replace("Z", "+00:00"))
                is_home = g["homeTeam"]["abbrev"] == "COL"
                opp = g["awayTeam"]["abbrev"] if is_home else g["homeTeam"]["abbrev"]
                prefix = "vs" if is_home else "@"
                col_score = g["homeTeam"].get("score", 0) if is_home else g["awayTeam"].get("score", 0)
                opp_score = g["awayTeam"].get("score", 0) if is_home else g["homeTeam"].get("score", 0)
                result = "W" if col_score > opp_score else "L"
                ot = ""
                if g.get("gameOutcome", {}).get("lastPeriodType", "REG") != "REG":
                    ot = f" ({g['gameOutcome']['lastPeriodType']})"
                recent_lines.append(f"  {dt.strftime('%b %d')} {prefix} {opp}: {result} {col_score}-{opp_score}{ot}")
            ctx_parts.append("RECENT RESULTS:\n" + "\n".join(recent_lines))
    except Exception:
        pass

    # Cap data
    if CAP_SEASONS:
        cs = CAP_SEASONS[0]
        ctx_parts.append(
            f"CAP SITUATION (2025-26): Cap:{cs['salary_cap']/1e6:.1f}M, "
            f"Hit:{cs['projected_cap_hit']/1e6:.1f}M, Space:{cs['projected_cap_space']/1e6:.1f}M, "
            f"F:{cs['cap_hit_forwards']/1e6:.1f}M, D:{cs['cap_hit_defence']/1e6:.1f}M, G:{cs['cap_hit_goalies']/1e6:.1f}M, "
            f"Roster:{cs['roster_count']}, Contracts:{cs['contracts']}"
        )

    return "\n\n".join(ctx_parts)


SYSTEM_PROMPT = """You are an AI hockey analyst for the Colorado Avalanche, powered by Databricks. You have access to live team data including player stats, standings, schedule, cap information, and game events.

Guidelines:
- Be professional, direct, and precise. No jokes, exclamation marks, or casual filler.
- Lead with the data. Keep answers concise and structured.
- Do not use markdown tables or formatting. Use plain text with clean spacing, dashes for lists, and clear labels.
- Format numbers cleanly (e.g., "$7.0M" not "$7000000", "22:14 TOI" not "1334 seconds").
- When listing multiple items, use a table or numbered list.
- If asked about video or specific game plays, note that the Video Review page has play-by-play events and goal highlights.
- If you don't have the data to answer, say so directly."""


@app.post("/api/chat")
async def chat(req: ChatRequest):
    """AI chat powered by Databricks Foundation Model API."""
    if not DATABRICKS_HOST or not DATABRICKS_CLIENT_ID or not DATABRICKS_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="AI not configured - missing Databricks credentials")

    try:
        context = await gather_context()

        messages = [
            {"role": "system", "content": f"{SYSTEM_PROMPT}\n\nHere is the current live data for the Colorado Avalanche:\n\n{context}"},
        ]
        # Add conversation history
        for msg in req.history[-10:]:  # Last 10 messages for context
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": req.message})

        token = await get_databricks_token()
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            resp = await client.post(
                f"{DATABRICKS_HOST}/serving-endpoints/{MODEL_ENDPOINT}/invocations",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "messages": messages,
                    "max_tokens": 1024,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            reply = data["choices"][0]["message"]["content"]
            return {"reply": reply}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Model API error: {e.response.text[:200]}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI error: {e}")


# Serve React static files
# Mount static assets first, then add SPA catch-all as an event handler
static_dir = Path(__file__).parent / "static"

if static_dir.exists() and (static_dir / "assets").exists():
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")


@app.on_event("startup")
async def _register_spa():
    """Register the SPA catch-all route LAST, after all API routes."""
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if not static_dir.exists():
            raise HTTPException(status_code=404)
        file_path = static_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(static_dir / "index.html")

"""팀 통계 API — API-Sports 연동"""
from fastapi import APIRouter
from db import get_pool
from services.stats_client import StatsClient

router = APIRouter()
client = StatsClient()


@router.get("/team/{team_name}")
async def get_team_stats(team_name: str, sport_key: str = "soccer_epl"):
    """팀 통계 조회"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT * FROM team_stats WHERE team_name = $1 AND sport_key = $2
        """, team_name, sport_key)

    if row:
        return dict(row)
    return {"error": "팀을 찾을 수 없습니다"}


@router.post("/sync/{league_id}")
async def sync_league_stats(league_id: int, season: int = 2025):
    """리그 팀 통계 동기화 (API-Football → DB)"""
    standings = await client.get_standings(league_id, season)

    pool = await get_pool()
    async with pool.acquire() as conn:
        count = 0
        for team_data in standings:
            team = team_data.get("team", {})
            stats_all = team_data.get("all", {})
            goals = stats_all.get("goals", {})
            played = stats_all.get("played", 0) or 1

            await conn.execute("""
                INSERT INTO team_stats (team_name, sport_key, avg_goals_scored, avg_goals_conceded, recent_form, last_updated)
                VALUES ($1, $2, $3, $4, $5, now())
                ON CONFLICT (team_name, sport_key) DO UPDATE SET
                    avg_goals_scored = $3, avg_goals_conceded = $4, recent_form = $5, last_updated = now()
            """,
                team.get("name", ""),
                f"soccer_league_{league_id}",
                (goals.get("for", 0) or 0) / played,
                (goals.get("against", 0) or 0) / played,
                team_data.get("form", ""),
            )
            count += 1

    return {"synced": count, "league_id": league_id}


@router.get("/elo-rankings/{sport_key}")
async def get_elo_rankings(sport_key: str):
    """ELO 랭킹"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT team_name, elo_rating, avg_goals_scored, avg_goals_conceded, recent_form
            FROM team_stats
            WHERE sport_key = $1
            ORDER BY elo_rating DESC
        """, sport_key)

    return {"rankings": [dict(r) for r in rows]}

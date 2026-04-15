"""배당 데이터 API — The Odds API 연동"""
from fastapi import APIRouter
from db import get_pool
from services.odds_client import OddsClient

router = APIRouter()
client = OddsClient()


@router.get("/sports")
async def get_sports():
    """지원하는 스포츠 목록"""
    sports = await client.get_sports()
    return {"sports": sports}


@router.get("/upcoming/{sport_key}")
async def get_upcoming_odds(sport_key: str, regions: str = "eu,uk", markets: str = "h2h"):
    """특정 스포츠의 다가오는 경기 배당"""
    data = await client.get_odds(sport_key, regions=regions, markets=markets)

    pool = await get_pool()
    async with pool.acquire() as conn:
        # 스포츠 키 등록
        await conn.execute("""
            INSERT INTO sport_types (key, group_name, title) VALUES ($1, $1, $1)
            ON CONFLICT (key) DO NOTHING
        """, sport_key)

        for match in data:
            # 경기 저장
            await conn.execute("""
                INSERT INTO matches (id, sport_key, home_team, away_team, commence_time)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO UPDATE SET commence_time = $5
            """, match["id"], sport_key, match["home_team"], match["away_team"], match["commence_time"])

            # 배당 스냅샷 저장
            for bm in match.get("bookmakers", []):
                for market in bm.get("markets", []):
                    for outcome in market.get("outcomes", []):
                        await conn.execute("""
                            INSERT INTO odds_snapshots (match_id, bookmaker, market, outcome_name, price)
                            VALUES ($1, $2, $3, $4, $5)
                        """, match["id"], bm["key"], market["key"], outcome["name"], outcome["price"])

    return {"matches": data, "count": len(data)}


@router.get("/best-odds/{match_id}")
async def get_best_odds(match_id: str):
    """특정 경기의 사이트별 최고 배당 비교"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT DISTINCT ON (outcome_name)
                outcome_name, bookmaker, price, snapshot_at
            FROM odds_snapshots
            WHERE match_id = $1 AND market = 'h2h'
            ORDER BY outcome_name, price DESC
        """, match_id)

    return {"match_id": match_id, "best_odds": [dict(r) for r in rows]}


@router.get("/value-bets/{sport_key}")
async def get_value_bets(sport_key: str, min_edge: float = 3.0):
    """Value Bet 탐색 — 내 예측 확률 > 사이트 내재확률인 경기"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT p.*, m.home_team, m.away_team, m.commence_time
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            WHERE m.sport_key = $1
              AND p.edge_pct >= $2
              AND m.commence_time > now()
            ORDER BY p.edge_pct DESC
        """, sport_key, min_edge)

    return {"value_bets": [dict(r) for r in rows]}

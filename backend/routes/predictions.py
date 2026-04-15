"""예측 API"""
from fastapi import APIRouter
from db import get_pool
from models.elo import EloModel
from models.poisson import PoissonModel

router = APIRouter()


@router.get("/match/{match_id}")
async def predict_match(match_id: str):
    """특정 경기 예측 (ELO + 포아송 하이브리드)"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        match = await conn.fetchrow("SELECT * FROM matches WHERE id = $1", match_id)
        if not match:
            return {"error": "경기를 찾을 수 없습니다"}

        home_stats = await conn.fetchrow(
            "SELECT * FROM team_stats WHERE team_name = $1 AND sport_key = $2",
            match["home_team"], match["sport_key"]
        )
        away_stats = await conn.fetchrow(
            "SELECT * FROM team_stats WHERE team_name = $1 AND sport_key = $2",
            match["away_team"], match["sport_key"]
        )
        # sport_key 매칭 실패 시 team_name만으로 fallback
        if not home_stats:
            home_stats = await conn.fetchrow(
                "SELECT * FROM team_stats WHERE team_name = $1", match["home_team"]
            )
        if not away_stats:
            away_stats = await conn.fetchrow(
                "SELECT * FROM team_stats WHERE team_name = $1", match["away_team"]
            )

        if not home_stats or not away_stats:
            return {"error": "팀 통계 데이터가 부족합니다. 먼저 /api/stats/sync를 실행하세요"}

        # ELO 예측
        elo = EloModel()
        elo_probs = elo.predict(
            float(home_stats["elo_rating"]),
            float(away_stats["elo_rating"]),
        )

        # 포아송 예측
        poisson = PoissonModel()
        poisson_probs = poisson.predict(
            float(home_stats["avg_goals_scored"]),
            float(home_stats["avg_goals_conceded"]),
            float(away_stats["avg_goals_scored"]),
            float(away_stats["avg_goals_conceded"]),
        )

        # 하이브리드 (ELO 40% + 포아송 60%)
        hybrid = {
            "home_win": elo_probs["home_win"] * 0.4 + poisson_probs["home_win"] * 0.6,
            "draw": elo_probs["draw"] * 0.4 + poisson_probs["draw"] * 0.6,
            "away_win": elo_probs["away_win"] * 0.4 + poisson_probs["away_win"] * 0.6,
        }

        # 최고 배당과 비교 → Value Bet 탐색
        best_odds = await conn.fetch("""
            SELECT DISTINCT ON (outcome_name)
                outcome_name, bookmaker, price
            FROM odds_snapshots
            WHERE match_id = $1 AND market = 'h2h'
            ORDER BY outcome_name, price DESC
        """, match_id)

        value_bets = []
        outcome_map = {match["home_team"]: "home_win", "Draw": "draw", match["away_team"]: "away_win"}
        for odds_row in best_odds:
            key = outcome_map.get(odds_row["outcome_name"])
            if key:
                implied_prob = 1 / float(odds_row["price"])
                my_prob = hybrid[key]
                edge = (my_prob - implied_prob) * 100
                if edge > 0:
                    value_bets.append({
                        "outcome": odds_row["outcome_name"],
                        "bookmaker": odds_row["bookmaker"],
                        "odds": float(odds_row["price"]),
                        "implied_prob": round(implied_prob * 100, 1),
                        "my_prob": round(my_prob * 100, 1),
                        "edge": round(edge, 1),
                    })

        # DB에 예측 저장
        best_value = max(value_bets, key=lambda x: x["edge"]) if value_bets else None
        await conn.execute("""
            INSERT INTO predictions (match_id, model_type, home_win_prob, draw_prob, away_win_prob,
                                     best_value_outcome, best_value_bookmaker, best_value_odds, edge_pct)
            VALUES ($1, 'hybrid_elo_poisson', $2, $3, $4, $5, $6, $7, $8)
        """,
            match_id,
            hybrid["home_win"], hybrid["draw"], hybrid["away_win"],
            best_value["outcome"] if best_value else None,
            best_value["bookmaker"] if best_value else None,
            best_value["odds"] if best_value else None,
            best_value["edge"] if best_value else None,
        )

    return {
        "match": {"home": match["home_team"], "away": match["away_team"], "time": str(match["commence_time"])},
        "elo_prediction": elo_probs,
        "poisson_prediction": poisson_probs,
        "hybrid_prediction": {k: round(v * 100, 1) for k, v in hybrid.items()},
        "value_bets": sorted(value_bets, key=lambda x: -x["edge"]),
    }


@router.get("/today/{sport_key}")
async def predict_today(sport_key: str):
    """오늘 경기 전체 예측"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        matches = await conn.fetch("""
            SELECT id FROM matches
            WHERE sport_key = $1 AND commence_time > now() AND commence_time < now() + interval '24 hours'
            AND NOT completed
        """, sport_key)

    results = []
    for m in matches:
        result = await predict_match(m["id"])
        results.append(result)

    return {"sport": sport_key, "predictions": results, "count": len(results)}

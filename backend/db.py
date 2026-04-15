"""DB 연결 관리 (asyncpg)"""
import asyncpg
from config import DATABASE_URL

pool: asyncpg.Pool | None = None


async def init_db():
    global pool
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    # 테이블 초기화
    async with pool.acquire() as conn:
        await conn.execute(SCHEMA_SQL)


async def close_db():
    global pool
    if pool:
        await pool.close()


async def get_pool() -> asyncpg.Pool:
    assert pool is not None
    return pool


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS sport_types (
    key TEXT PRIMARY KEY,
    group_name TEXT,
    title TEXT,
    active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    sport_key TEXT REFERENCES sport_types(key),
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    commence_time TIMESTAMPTZ NOT NULL,
    completed BOOLEAN DEFAULT false,
    home_score INT,
    away_score INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS odds_snapshots (
    id BIGSERIAL PRIMARY KEY,
    match_id TEXT REFERENCES matches(id),
    bookmaker TEXT NOT NULL,
    market TEXT NOT NULL,
    outcome_name TEXT NOT NULL,
    price NUMERIC(8,4) NOT NULL,
    snapshot_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_odds_match ON odds_snapshots(match_id, snapshot_at DESC);

CREATE TABLE IF NOT EXISTS team_stats (
    id BIGSERIAL PRIMARY KEY,
    team_name TEXT NOT NULL,
    sport_key TEXT NOT NULL,
    elo_rating NUMERIC(8,2) DEFAULT 1500,
    avg_goals_scored NUMERIC(6,3) DEFAULT 0,
    avg_goals_conceded NUMERIC(6,3) DEFAULT 0,
    recent_form TEXT DEFAULT '',
    last_updated TIMESTAMPTZ DEFAULT now(),
    UNIQUE(team_name, sport_key)
);

CREATE TABLE IF NOT EXISTS predictions (
    id BIGSERIAL PRIMARY KEY,
    match_id TEXT REFERENCES matches(id),
    model_type TEXT NOT NULL,
    home_win_prob NUMERIC(5,4),
    draw_prob NUMERIC(5,4),
    away_win_prob NUMERIC(5,4),
    best_value_outcome TEXT,
    best_value_bookmaker TEXT,
    best_value_odds NUMERIC(8,4),
    edge_pct NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT now()
);
"""

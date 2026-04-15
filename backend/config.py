"""환경 설정"""
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://sportspredict:sportspredict@db:5432/sportspredict")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
ODDS_API_KEY = os.getenv("ODDS_API_KEY", "")
API_SPORTS_KEY = os.getenv("API_SPORTS_KEY", "")

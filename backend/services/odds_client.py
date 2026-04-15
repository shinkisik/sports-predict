"""The Odds API 클라이언트"""
import httpx
from datetime import datetime, timezone
from config import ODDS_API_KEY

BASE_URL = "https://api.the-odds-api.com/v4"


class OddsClient:
    def __init__(self):
        self.api_key = ODDS_API_KEY

    async def get_sports(self) -> list[dict]:
        """활성 스포츠 목록"""
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{BASE_URL}/sports", params={"apiKey": self.api_key})
            resp.raise_for_status()
            return resp.json()

    async def get_odds(self, sport_key: str, regions: str = "eu,uk", markets: str = "h2h") -> list[dict]:
        """경기별 배당 데이터"""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{BASE_URL}/sports/{sport_key}/odds",
                params={
                    "apiKey": self.api_key,
                    "regions": regions,
                    "markets": markets,
                    "oddsFormat": "decimal",
                    "dateFormat": "iso",
                },
            )
            resp.raise_for_status()

            data = resp.json()
            # commence_time 파싱
            for match in data:
                if isinstance(match.get("commence_time"), str):
                    match["commence_time"] = datetime.fromisoformat(
                        match["commence_time"].replace("Z", "+00:00")
                    )
            return data

    async def get_scores(self, sport_key: str, days_from: int = 1) -> list[dict]:
        """경기 결과/스코어"""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{BASE_URL}/sports/{sport_key}/scores",
                params={"apiKey": self.api_key, "daysFrom": days_from},
            )
            resp.raise_for_status()
            return resp.json()

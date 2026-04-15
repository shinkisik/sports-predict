"""API-Sports (API-Football) 클라이언트"""
import httpx
from config import API_SPORTS_KEY

BASE_URL = "https://v3.football.api-sports.io"


class StatsClient:
    def __init__(self):
        self.headers = {
            "x-apisports-key": API_SPORTS_KEY,
        }

    async def get_standings(self, league_id: int, season: int = 2025) -> list[dict]:
        """리그 순위표 + 팀 통계"""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{BASE_URL}/standings",
                headers=self.headers,
                params={"league": league_id, "season": season},
            )
            resp.raise_for_status()
            data = resp.json()

            standings = []
            for league in data.get("response", []):
                for group in league.get("league", {}).get("standings", []):
                    standings.extend(group)
            return standings

    async def get_fixtures(self, league_id: int, season: int = 2025, next_n: int = 10) -> list[dict]:
        """다음 경기 목록"""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{BASE_URL}/fixtures",
                headers=self.headers,
                params={"league": league_id, "season": season, "next": next_n},
            )
            resp.raise_for_status()
            return resp.json().get("response", [])

    async def get_h2h(self, team1_id: int, team2_id: int, last: int = 10) -> list[dict]:
        """상대전적"""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{BASE_URL}/fixtures/headtohead",
                headers=self.headers,
                params={"h2h": f"{team1_id}-{team2_id}", "last": last},
            )
            resp.raise_for_status()
            return resp.json().get("response", [])

    async def get_team_stats(self, team_id: int, league_id: int, season: int = 2025) -> dict:
        """팀 상세 통계"""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{BASE_URL}/teams/statistics",
                headers=self.headers,
                params={"team": team_id, "league": league_id, "season": season},
            )
            resp.raise_for_status()
            return resp.json().get("response", {})

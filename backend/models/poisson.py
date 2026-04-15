"""포아송 분포 기반 경기 결과 예측 모델"""
import math
from functools import lru_cache


class PoissonModel:
    """
    포아송 분포를 이용한 축구/스포츠 결과 예측.
    팀의 평균 득실점으로 정확한 스코어 확률 계산.
    """

    MAX_GOALS = 8  # 계산할 최대 골 수

    def predict(
        self,
        home_attack: float,
        home_defense: float,
        away_attack: float,
        away_defense: float,
        league_avg: float = 1.35,
    ) -> dict[str, float]:
        """
        Args:
            home_attack: 홈팀 평균 득점
            home_defense: 홈팀 평균 실점
            away_attack: 어웨이팀 평균 득점
            away_defense: 어웨이팀 평균 실점
            league_avg: 리그 평균 경기당 득점

        Returns:
            {"home_win": 0.xx, "draw": 0.xx, "away_win": 0.xx, "expected_score": "1.5 - 1.1"}
        """
        # 기대 골 수 계산
        home_exp = (home_attack / league_avg) * (away_defense / league_avg) * league_avg * 1.05  # 홈 보정
        away_exp = (away_attack / league_avg) * (home_defense / league_avg) * league_avg

        # 최소값 보정
        home_exp = max(home_exp, 0.3)
        away_exp = max(away_exp, 0.3)

        # 스코어 매트릭스 계산
        home_win = 0.0
        draw = 0.0
        away_win = 0.0

        for h in range(self.MAX_GOALS + 1):
            for a in range(self.MAX_GOALS + 1):
                prob = self._poisson_prob(home_exp, h) * self._poisson_prob(away_exp, a)
                if h > a:
                    home_win += prob
                elif h == a:
                    draw += prob
                else:
                    away_win += prob

        # 정규화
        total = home_win + draw + away_win
        return {
            "home_win": round(home_win / total, 4),
            "draw": round(draw / total, 4),
            "away_win": round(away_win / total, 4),
            "expected_score": f"{home_exp:.1f} - {away_exp:.1f}",
        }

    @staticmethod
    @lru_cache(maxsize=1024)
    def _poisson_prob(lam: float, k: int) -> float:
        """포아송 확률 P(X=k) = (λ^k * e^(-λ)) / k!"""
        return (lam ** k) * math.exp(-lam) / math.factorial(k)

    def predict_over_under(
        self,
        home_attack: float,
        home_defense: float,
        away_attack: float,
        away_defense: float,
        line: float = 2.5,
        league_avg: float = 1.35,
    ) -> dict[str, float]:
        """오버/언더 확률"""
        home_exp = (home_attack / league_avg) * (away_defense / league_avg) * league_avg * 1.05
        away_exp = (away_attack / league_avg) * (home_defense / league_avg) * league_avg
        home_exp = max(home_exp, 0.3)
        away_exp = max(away_exp, 0.3)

        under = 0.0
        for h in range(self.MAX_GOALS + 1):
            for a in range(self.MAX_GOALS + 1):
                if (h + a) <= line:
                    under += self._poisson_prob(home_exp, h) * self._poisson_prob(away_exp, a)

        return {"over": round(1 - under, 4), "under": round(under, 4), "line": line}

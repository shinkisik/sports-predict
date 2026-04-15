"""ELO 레이팅 기반 승률 예측 모델"""
import math


class EloModel:
    """
    ELO 레이팅 시스템으로 승/무/패 확률 계산.
    체스 ELO를 축구/스포츠에 맞게 확장.
    """

    HOME_ADVANTAGE = 65  # 홈 어드밴티지 ELO 보정치
    K_FACTOR = 32  # 레이팅 변동 속도

    def predict(self, home_elo: float, away_elo: float) -> dict[str, float]:
        """
        Args:
            home_elo: 홈팀 ELO 레이팅
            away_elo: 어웨이팀 ELO 레이팅

        Returns:
            {"home_win": 0.xx, "draw": 0.xx, "away_win": 0.xx}
        """
        # 홈 어드밴티지 적용
        adjusted_home = home_elo + self.HOME_ADVANTAGE

        # ELO 기반 기대 승률 (로지스틱 함수)
        exp_home = 1 / (1 + 10 ** ((away_elo - adjusted_home) / 400))
        exp_away = 1 - exp_home

        # 무승부 확률 분리 (ELO 차이가 작을수록 무승부 확률 높음)
        elo_diff = abs(adjusted_home - away_elo)
        draw_base = 0.28 * math.exp(-elo_diff / 600)  # 최대 ~28%, ELO차 클수록 감소

        # 최종 확률 정규화
        home_win = exp_home * (1 - draw_base)
        away_win = exp_away * (1 - draw_base)
        draw = draw_base

        total = home_win + draw + away_win
        return {
            "home_win": round(home_win / total, 4),
            "draw": round(draw / total, 4),
            "away_win": round(away_win / total, 4),
        }

    @staticmethod
    def update_ratings(
        home_elo: float, away_elo: float, result: str, k: float = 32
    ) -> tuple[float, float]:
        """
        경기 결과에 따라 ELO 업데이트.

        Args:
            result: "home" | "draw" | "away"
        Returns:
            (new_home_elo, new_away_elo)
        """
        exp_home = 1 / (1 + 10 ** ((away_elo - home_elo) / 400))

        score_map = {"home": 1.0, "draw": 0.5, "away": 0.0}
        actual = score_map[result]

        new_home = home_elo + k * (actual - exp_home)
        new_away = away_elo + k * ((1 - actual) - (1 - exp_home))

        return round(new_home, 2), round(new_away, 2)

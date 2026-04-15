import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";

interface ValueBet {
  outcome: string;
  bookmaker: string;
  odds: number;
  implied_prob: number;
  my_prob: number;
  edge: number;
}

interface Prediction {
  match: { home: string; away: string; time: string };
  hybrid_prediction: { home_win: number; draw: number; away_win: number };
  value_bets: ValueBet[];
}

export default function Dashboard() {
  const [health, setHealth] = useState<string>("확인 중...");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [predLoading, setPredLoading] = useState(false);

  useEffect(() => {
    fetch("/health")
      .then((r) => r.json())
      .then(() => setHealth("정상"))
      .catch(() => setHealth("연결 실패"));

    // 오늘 예측 자동 로드
    setPredLoading(true);
    api.get<{ predictions: Prediction[] }>("/predict/today/soccer_epl")
      .then((data) => setPredictions(data.predictions || []))
      .catch(() => {})
      .finally(() => setPredLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">대시보드</h2>
        <span
          className={`px-3 py-1 rounded-full text-xs ${
            health === "정상" ? "bg-emerald-600/20 text-emerald-400" : "bg-red-600/20 text-red-400"
          }`}
        >
          서버: {health}
        </span>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <Card
          title="오늘 경기"
          value={predLoading ? "..." : predictions.length > 0 ? `${predictions.length}경기` : "-"}
          sub={predictions.length > 0 ? "EPL 예측 완료" : "데이터 수집 필요"}
        />
        <Card
          title="Value Bets"
          value={predLoading ? "..." : predictions.length > 0 ? `${predictions.filter(p => p.value_bets?.length > 0).length}건` : "-"}
          sub={predictions.length > 0 ? "플러스 엣지 발견" : "예측 모델 실행 필요"}
        />
        <Card title="API 상태" value="활성" sub="The Odds API + API-Sports" />
      </div>

      {/* 오늘 예측 */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">오늘 경기 예측 (EPL)</h3>
          <Link
            to="/predictions"
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            다른 리그 예측 →
          </Link>
        </div>
        {predLoading ? (
          <p className="text-gray-500 text-sm">예측 로딩 중...</p>
        ) : predictions.length === 0 ? (
          <p className="text-gray-500 text-sm">
            오늘 EPL 예정 경기가 없거나 팀 통계 데이터가 부족합니다.{" "}
            <Link to="/predictions" className="text-emerald-400 hover:underline">예측 페이지</Link>에서
            직접 실행해보세요.
          </p>
        ) : (
          <div className="space-y-3">
            {predictions.map((p, i) => {
              const pr = p.hybrid_prediction;
              const maxP = Math.max(pr.home_win, pr.draw, pr.away_win);
              const predicted = maxP === pr.home_win ? p.match.home : maxP === pr.away_win ? p.match.away : "무승부";
              return (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="min-w-0">
                    <span className="font-medium">{p.match.home}</span>
                    <span className="text-gray-500 mx-2">vs</span>
                    <span className="font-medium">{p.match.away}</span>
                  </div>
                  <div className="flex gap-4 text-sm shrink-0 mx-4">
                    <span className={maxP === pr.home_win ? "text-emerald-400 font-bold" : "text-gray-400"}>홈 {pr.home_win}%</span>
                    <span className={maxP === pr.draw ? "text-emerald-400 font-bold" : "text-gray-400"}>무 {pr.draw}%</span>
                    <span className={maxP === pr.away_win ? "text-emerald-400 font-bold" : "text-gray-400"}>원정 {pr.away_win}%</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-white font-medium">{predicted}</span>
                    {p.value_bets?.length > 0 && (
                      <span className="bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded text-xs">
                        Value +{p.value_bets[0].edge}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-gray-500 text-xs mt-1">{sub}</p>
    </div>
  );
}

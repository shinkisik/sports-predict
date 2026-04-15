import { useEffect, useState } from "react";

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
  const [predictions] = useState<Prediction[]>([]);

  useEffect(() => {
    fetch("/health")
      .then((r) => r.json())
      .then(() => setHealth("정상"))
      .catch(() => setHealth("연결 실패"));
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
        <Card title="오늘 경기" value="-" sub="데이터 수집 필요" />
        <Card title="Value Bets" value="-" sub="예측 모델 실행 필요" />
        <Card title="API 상태" value="활성" sub="The Odds API + API-Sports" />
      </div>

      {/* 최근 예측 */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h3 className="text-lg font-semibold mb-4">최근 예측</h3>
        {predictions.length === 0 ? (
          <p className="text-gray-500 text-sm">
            아직 예측 데이터가 없습니다. /api/odds/upcoming/soccer_epl 을 먼저 호출하여 배당 데이터를 수집하세요.
          </p>
        ) : (
          <div className="space-y-3">
            {predictions.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <span className="font-medium">{p.match.home}</span>
                  <span className="text-gray-500 mx-2">vs</span>
                  <span className="font-medium">{p.match.away}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span>홈 {p.hybrid_prediction.home_win}%</span>
                  <span>무 {p.hybrid_prediction.draw}%</span>
                  <span>원정 {p.hybrid_prediction.away_win}%</span>
                </div>
                {p.value_bets.length > 0 && (
                  <span className="bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded text-xs">
                    Value +{p.value_bets[0].edge}%
                  </span>
                )}
              </div>
            ))}
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

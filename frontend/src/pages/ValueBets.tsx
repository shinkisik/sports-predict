import { useState } from "react";
import api from "@/lib/api";

interface ValueBetData {
  match_id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  best_value_outcome: string;
  best_value_bookmaker: string;
  best_value_odds: number;
  edge_pct: number;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
}

export default function ValueBets() {
  const [bets, setBets] = useState<ValueBetData[]>([]);
  const [sport, setSport] = useState("soccer_epl");
  const [minEdge, setMinEdge] = useState(3);

  const fetchValueBets = async () => {
    try {
      const data = await api.get<{ value_bets: ValueBetData[] }>(
        `/odds/value-bets/${sport}?min_edge=${minEdge}`
      );
      setBets(data.value_bets || []);
    } catch {
      // 에러
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Value Bets</h2>
        <select
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="soccer_epl">EPL</option>
          <option value="soccer_germany_bundesliga">분데스리가</option>
          <option value="basketball_nba">NBA</option>
          <option value="baseball_mlb">MLB</option>
        </select>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">최소 Edge:</span>
          <input
            type="number"
            value={minEdge}
            onChange={(e) => setMinEdge(Number(e.target.value))}
            className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1"
            min={0}
            step={0.5}
          />
          <span className="text-gray-500">%</span>
        </div>
        <button
          onClick={fetchValueBets}
          className="bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 rounded-lg text-sm"
        >
          검색
        </button>
      </div>

      <p className="text-gray-500 text-sm">
        내 예측 확률이 사이트 내재확률보다 높은 경기를 찾습니다. Edge가 클수록 기대 가치가 높습니다.
      </p>

      {/* Value Bet 목록 */}
      <div className="space-y-3">
        {bets.length === 0 && (
          <div className="text-gray-500 text-sm bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            Value Bet이 없거나, 먼저 배당 데이터 수집 + 예측 모델 실행이 필요합니다.
          </div>
        )}
        {bets.map((bet, i) => (
          <div
            key={i}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <div className="font-semibold">
                {bet.home_team} vs {bet.away_team}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                예측: 홈 {(bet.home_win_prob * 100).toFixed(1)}% / 무{" "}
                {(bet.draw_prob * 100).toFixed(1)}% / 원정{" "}
                {(bet.away_win_prob * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-emerald-400 font-bold text-lg">
                +{bet.edge_pct.toFixed(1)}% Edge
              </div>
              <div className="text-sm text-gray-400">
                {bet.best_value_outcome} @ {bet.best_value_odds?.toFixed(2)} ({bet.best_value_bookmaker})
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

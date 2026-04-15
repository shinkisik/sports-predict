import { useState } from "react";
import api from "@/lib/api";

interface OddsMatch {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number }>;
    }>;
  }>;
}

export default function Matches() {
  const [matches, setMatches] = useState<OddsMatch[]>([]);
  const [sport, setSport] = useState("soccer_epl");
  const [loading, setLoading] = useState(false);

  const fetchOdds = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ matches: OddsMatch[] }>(`/odds/upcoming/${sport}`);
      setMatches(data.matches || []);
    } catch {
      // API 호출 실패
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">경기 배당</h2>
        <select
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="soccer_epl">EPL</option>
          <option value="soccer_germany_bundesliga">분데스리가</option>
          <option value="soccer_spain_la_liga">라리가</option>
          <option value="soccer_italy_serie_a">세리에A</option>
          <option value="basketball_nba">NBA</option>
          <option value="baseball_mlb">MLB</option>
          <option value="mma_mixed_martial_arts">UFC</option>
        </select>
        <button
          onClick={fetchOdds}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 rounded-lg text-sm disabled:opacity-50"
        >
          {loading ? "수집 중..." : "배당 수집"}
        </button>
      </div>

      {/* 경기 목록 */}
      <div className="space-y-4">
        {matches.length === 0 && (
          <p className="text-gray-500 text-sm">배당 수집 버튼을 클릭하여 최신 배당을 가져오세요.</p>
        )}
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: OddsMatch }) {
  // 모든 북메이커에서 각 결과별 최고 배당 찾기
  const bestOdds: Record<string, { price: number; bookmaker: string }> = {};

  for (const bm of match.bookmakers) {
    for (const market of bm.markets) {
      if (market.key !== "h2h") continue;
      for (const outcome of market.outcomes) {
        if (!bestOdds[outcome.name] || outcome.price > bestOdds[outcome.name].price) {
          bestOdds[outcome.name] = { price: outcome.price, bookmaker: bm.title };
        }
      }
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="text-lg font-semibold">
          {match.home_team} <span className="text-gray-500 mx-2">vs</span> {match.away_team}
        </div>
        <span className="text-gray-500 text-sm">
          {new Date(match.commence_time).toLocaleString("ko-KR")}
        </span>
      </div>

      {/* 최고 배당 */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(bestOdds).map(([name, data]) => (
          <div key={name} className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400">{name}</p>
            <p className="text-xl font-bold text-emerald-400">{data.price.toFixed(2)}</p>
            <p className="text-xs text-gray-500">{data.bookmaker}</p>
          </div>
        ))}
      </div>

      {/* 북메이커 수 */}
      <p className="text-xs text-gray-600 mt-2">{match.bookmakers.length}개 사이트 비교</p>
    </div>
  );
}

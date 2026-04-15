import { useState } from "react";
import api from "@/lib/api";

interface ValueBet {
  outcome: string;
  bookmaker: string;
  odds: number;
  implied_prob: number;
  my_prob: number;
  edge: number;
}

interface PredictionResult {
  match: { home: string; away: string; time: string };
  hybrid_prediction: { home_win: number; draw: number; away_win: number };
  value_bets: ValueBet[];
  error?: string;
}

interface TodayResponse {
  sport: string;
  predictions: PredictionResult[];
  count: number;
}

const SPORTS = [
  { value: "soccer_epl", label: "EPL" },
  { value: "soccer_germany_bundesliga", label: "분데스리가" },
  { value: "soccer_spain_la_liga", label: "라리가" },
  { value: "soccer_italy_serie_a", label: "세리에A" },
  { value: "basketball_nba", label: "NBA" },
  { value: "baseball_mlb", label: "MLB" },
];

export default function Predictions() {
  const [sport, setSport] = useState("soccer_epl");
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [step, setStep] = useState<"idle" | "collecting" | "predicting" | "done">("idle");
  const [message, setMessage] = useState("");

  const run = async () => {
    setPredictions([]);
    setMessage("");

    // Step 1: 배당 수집 (경기 DB 저장)
    setStep("collecting");
    setMessage("배당 데이터 수집 중...");
    try {
      await api.get(`/odds/upcoming/${sport}`);
    } catch {
      setMessage("배당 수집 실패. API 키를 확인하세요.");
      setStep("idle");
      return;
    }

    // Step 2: 예측 실행
    setStep("predicting");
    setMessage("예측 모델 실행 중...");
    try {
      const data = await api.get<TodayResponse>(`/predictions/today/${sport}`);
      setPredictions(data.predictions || []);
      if ((data.predictions || []).length === 0) {
        setMessage("오늘 예정된 경기가 없거나 팀 통계 데이터가 부족합니다.");
      } else {
        setMessage(`${data.predictions.length}경기 예측 완료`);
      }
    } catch {
      setMessage("예측 실패. 팀 통계 데이터가 필요합니다 (/api/stats/sync 먼저 실행).");
    }
    setStep("done");
  };

  const loading = step === "collecting" || step === "predicting";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">경기 예측</h2>
        <select
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          disabled={loading}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
        >
          {SPORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button
          onClick={run}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {step === "collecting" ? "배당 수집 중..." : "예측 중..."}
            </span>
          ) : (
            "예측 실행"
          )}
        </button>
      </div>

      {/* 상태 메시지 */}
      {message && (
        <div className={`px-4 py-2 rounded-lg text-sm ${
          message.includes("실패") || message.includes("부족")
            ? "bg-red-600/20 text-red-400"
            : "bg-emerald-600/20 text-emerald-400"
        }`}>
          {message}
        </div>
      )}

      {/* 예측 결과 */}
      {predictions.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left px-5 py-3">경기</th>
                <th className="text-center px-4 py-3">홈 승</th>
                <th className="text-center px-4 py-3">무</th>
                <th className="text-center px-4 py-3">원정 승</th>
                <th className="text-center px-4 py-3">예상 결과</th>
                <th className="text-center px-4 py-3">Value Bet</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p, i) => {
                const probs = p.hybrid_prediction;
                const maxProb = Math.max(probs.home_win, probs.draw, probs.away_win);
                const predicted =
                  maxProb === probs.home_win
                    ? p.match.home
                    : maxProb === probs.away_win
                    ? p.match.away
                    : "무승부";
                const bestBet = p.value_bets?.[0];

                return (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium">{p.match.home} <span className="text-gray-500">vs</span> {p.match.away}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{formatTime(p.match.time)}</div>
                    </td>
                    <td className={`text-center px-4 py-3 font-bold ${maxProb === probs.home_win ? "text-emerald-400" : "text-gray-300"}`}>
                      {probs.home_win}%
                    </td>
                    <td className={`text-center px-4 py-3 font-bold ${maxProb === probs.draw ? "text-emerald-400" : "text-gray-300"}`}>
                      {probs.draw}%
                    </td>
                    <td className={`text-center px-4 py-3 font-bold ${maxProb === probs.away_win ? "text-emerald-400" : "text-gray-300"}`}>
                      {probs.away_win}%
                    </td>
                    <td className="text-center px-4 py-3 text-white font-medium">{predicted}</td>
                    <td className="text-center px-4 py-3">
                      {bestBet ? (
                        <span className="bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded text-xs">
                          {bestBet.outcome} {bestBet.odds} (+{bestBet.edge}%)
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">없음</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 안내 */}
      {predictions.length === 0 && step === "idle" && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center text-gray-500 text-sm">
          <p className="text-2xl mb-3">🔮</p>
          <p>리그를 선택하고 <strong className="text-white">예측 실행</strong>을 누르면</p>
          <p>오늘 경기의 승/무/패 확률을 예측합니다.</p>
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

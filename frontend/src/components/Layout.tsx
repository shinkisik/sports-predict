import { Outlet, NavLink } from "react-router-dom";
import { BarChart3, Trophy, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: BarChart3, label: "대시보드" },
  { to: "/predictions", icon: Sparkles, label: "경기 예측" },
  { to: "/matches", icon: Trophy, label: "경기 배당" },
  { to: "/value-bets", icon: TrendingUp, label: "Value Bets" },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* 사이드바 */}
      <aside className="w-56 border-r border-gray-800 p-4 flex flex-col gap-1">
        <h1 className="text-xl font-bold text-emerald-400 mb-6 px-3">
          ⚽ Sports Predict
        </h1>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-emerald-600/20 text-emerald-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}

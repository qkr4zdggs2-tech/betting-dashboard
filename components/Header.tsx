"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="border-b border-gray-800 bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black font-bold text-sm">
              VB
            </div>
            <span className="font-bold text-lg tracking-tight">ValueBets</span>
            <span className="text-xs bg-emerald-900 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
              LIVE
            </span>
          </div>
          <nav className="flex items-center gap-1 ml-2">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                pathname === "/" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              ⚽ Matches
            </Link>
            <Link
              href="/tennis"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                pathname === "/tennis" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              🎾 Tennis
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" />
          Scanning Betano · Tipsport · Fortuna
        </div>
      </div>
    </header>
  );
}

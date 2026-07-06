"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function RefreshButton({ puuid, disabledUntil }: { puuid: string; disabledUntil?: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [remainingMs, setRemainingMs] = useState(0);
  const disabled = loading || remainingMs > 0;

  useEffect(() => {
    if (!disabledUntil) return;
    const updateRemaining = () => setRemainingMs(Math.max(disabledUntil - Date.now(), 0));
    updateRemaining();
    const interval = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(interval);
  }, [disabledUntil]);

  async function refresh() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/summoners/${encodeURIComponent(puuid)}/refresh`, { method: "POST" });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error ?? "갱신에 실패했습니다.");
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={refresh}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        갱신
      </button>
      {remainingMs > 0 ? <span className="text-xs text-slate-500">3분 쿨다운 적용 중</span> : null}
      {message ? <span className="max-w-64 text-right text-xs text-red-600">{message}</span> : null}
    </div>
  );
}

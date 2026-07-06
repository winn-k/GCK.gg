"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncScrimButton({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sync() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/scrims/${id}/sync`, { method: "POST" });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "동기화 실패");
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={sync}
        disabled={loading}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 disabled:opacity-50"
      >
        <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        수동 동기화
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function MatchSyncStatus({
  puuid,
  missingCount,
  totalCount,
}: {
  puuid: string;
  missingCount: number;
  totalCount: number;
}) {
  const router = useRouter();
  const started = useRef(false);
  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">(missingCount > 0 ? "idle" : "done");

  useEffect(() => {
    if (missingCount <= 0 || started.current) return;
    started.current = true;
    setStatus("syncing");

    fetch(`/api/summoners/${encodeURIComponent(puuid)}/matches/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: totalCount || 12 }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("sync failed");
        setStatus("done");
        router.refresh();
      })
      .catch(() => setStatus("error"));
  }, [missingCount, puuid, router, totalCount]);

  if (missingCount <= 0) return null;

  return (
    <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
      <div className="flex items-center gap-2 font-semibold">
        {status === "syncing" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {status === "error" ? "경기 분석을 불러오지 못했습니다." : "최근 경기 분석을 채우는 중입니다."}
      </div>
      <p className="mt-1 text-xs text-cyan-100/70">
        먼저 캐시된 경기부터 보여주고, 누락된 {missingCount}경기는 뒤에서 가져옵니다.
      </p>
    </div>
  );
}

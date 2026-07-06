"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SearchBox({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [riotId, setRiotId] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const [gameName, tagLine] = riotId.split("#").map((part) => part.trim());
    if (!gameName || !tagLine) {
      setError("Riot ID를 gameName#tagLine 형식으로 입력하세요.");
      return;
    }
    router.push(`/summoners/kr/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="riot-id">
          Riot ID
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="riot-id"
            value={riotId}
            onChange={(event) => {
              setRiotId(event.target.value);
              setError("");
            }}
            placeholder="Hide on bush#KR1"
          className="h-12 w-full rounded-md border border-white/10 bg-black/20 pl-10 pr-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>
        <button
          type="submit"
          className="h-12 rounded-md bg-cyan-300 px-5 font-black text-slate-950 transition hover:bg-cyan-200"
        >
          검색
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {!compact ? <p className="mt-2 text-sm text-slate-500">KR 서버 기준 Riot ID로 검색합니다.</p> : null}
    </form>
  );
}

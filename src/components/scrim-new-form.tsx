"use client";

import { CalendarClock, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function ScrimNewForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/scrims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        scheduledAt: form.get("scheduledAt"),
        adminPassword: form.get("adminPassword"),
        teams: [
          { teamName: String(form.get("teamA") || "블루팀"), players: String(form.get("playersA") || "") },
          { teamName: String(form.get("teamB") || "레드팀"), players: String(form.get("playersB") || "") },
        ],
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "내전 생성에 실패했습니다.");
      setLoading(false);
      return;
    }

    const codeResponse = await fetch(`/api/scrims/${json.scrim.id}/create-tournament-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword: form.get("adminPassword") }),
    });
    const codeJson = await codeResponse.json();
    if (!codeResponse.ok) {
      setError(codeJson.error ?? "내전은 생성됐지만 Tournament Code 발급에 실패했습니다.");
      router.push(`/scrims/${json.scrim.id}`);
      return;
    }

    router.push(`/scrims/${json.scrim.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">경기명</span>
          <input name="title" required className="mt-1 h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 text-white outline-none focus:border-cyan-400" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">예정 시간</span>
          <div className="relative mt-1">
            <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="scheduledAt" type="datetime-local" className="h-11 w-full rounded-md border border-white/10 bg-black/20 pl-9 pr-3 text-white outline-none focus:border-cyan-400" />
          </div>
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-slate-300">설명</span>
        <textarea name="description" rows={3} className="mt-1 w-full rounded-md border border-white/10 bg-black/20 p-3 text-white outline-none focus:border-cyan-400" />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <TeamBox suffix="A" defaultName="블루팀" />
        <TeamBox suffix="B" defaultName="레드팀" />
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-slate-300">관리자 비밀번호</span>
        <input name="adminPassword" type="password" className="mt-1 h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 text-white outline-none focus:border-cyan-400" />
      </label>
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 items-center gap-2 rounded-md bg-cyan-300 px-4 font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        {loading ? "생성 중" : "내전 생성 및 코드 발급"}
      </button>
    </form>
  );
}

function TeamBox({ suffix, defaultName }: { suffix: "A" | "B"; defaultName: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/15 p-4">
      <label className="block">
        <span className="text-sm font-semibold text-slate-300">팀명</span>
        <input name={`team${suffix}`} defaultValue={defaultName} className="mt-1 h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-white outline-none focus:border-cyan-400" />
      </label>
      <label className="mt-3 block">
        <span className="text-sm font-semibold text-slate-300">선수 Riot ID</span>
        <textarea
          name={`players${suffix}`}
          rows={5}
          placeholder={"Hide on bush#KR1\n친구닉#KR1"}
          className="mt-1 w-full rounded-md border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
        />
      </label>
    </div>
  );
}

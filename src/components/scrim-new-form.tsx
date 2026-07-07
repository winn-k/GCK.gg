"use client";

import { Lock, Plus } from "lucide-react";
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
    const adminPassword = form.get("adminPassword");

    const response = await fetch("/api/scrims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        adminPassword,
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
      body: JSON.stringify({ adminPassword }),
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
      <label className="block">
        <span className="text-sm font-semibold text-slate-300">내전 이름</span>
        <input
          name="title"
          required
          autoFocus
          placeholder="예: 금요일 5대5 내전"
          className="mt-1 h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-300">관리자 비밀번호</span>
        <div className="relative mt-1">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            name="adminPassword"
            type="password"
            required
            className="h-11 w-full rounded-md border border-white/10 bg-black/20 pl-9 pr-3 text-white outline-none focus:border-cyan-400"
          />
        </div>
      </label>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 items-center gap-2 rounded-md bg-cyan-300 px-4 font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        {loading ? "생성 중..." : "내전 생성 및 코드 발급"}
      </button>
    </form>
  );
}

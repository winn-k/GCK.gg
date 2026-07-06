"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({ fallback = "/", label = "뒤로" }: { fallback?: string; label?: string }) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}

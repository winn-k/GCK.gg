"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-200"
      title="Tournament Code 복사"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "복사됨" : "복사"}
    </button>
  );
}

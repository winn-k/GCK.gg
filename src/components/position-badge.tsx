import { Badge, Crosshair, HeartHandshake, Shield, Trees, WandSparkles, type LucideIcon } from "lucide-react";
import { positionLabel } from "@/lib/analytics/match";
import { cn } from "@/lib/utils";

const positionIcons: Record<string, LucideIcon> = {
  TOP: Shield,
  JUNGLE: Trees,
  MID: WandSparkles,
  ADC: Crosshair,
  SUPPORT: HeartHandshake,
  UNKNOWN: Badge,
};

const positionClass: Record<string, string> = {
  TOP: "border-sky-300/30 bg-sky-300/10 text-sky-100",
  JUNGLE: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  MID: "border-violet-300/30 bg-violet-300/10 text-violet-100",
  ADC: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  SUPPORT: "border-rose-300/30 bg-rose-300/10 text-rose-100",
  UNKNOWN: "border-white/10 bg-white/[0.04] text-slate-200",
};

export function PositionBadge({ position, compact = false }: { position: string; compact?: boolean }) {
  const Icon = positionIcons[position] ?? Badge;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-bold",
        compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs",
        positionClass[position] ?? positionClass.UNKNOWN,
      )}
    >
      <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {positionLabel(position)}
    </span>
  );
}

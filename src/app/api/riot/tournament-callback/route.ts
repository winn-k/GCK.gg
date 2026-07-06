import { NextRequest, NextResponse } from "next/server";
import { recordTournamentCallback } from "@/lib/services/scrims";
import type { TournamentCallbackPayload } from "@/lib/riot/types";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as TournamentCallbackPayload;
  recordTournamentCallback(payload).catch((error) => {
    console.error("Tournament callback sync failed", error);
  });
  return NextResponse.json({ ok: true });
}

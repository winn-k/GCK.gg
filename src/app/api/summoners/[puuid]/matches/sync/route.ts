import { NextResponse } from "next/server";
import { riotErrorMessage } from "@/lib/riot/errors";
import { syncSummonerMatches } from "@/lib/services/summoners";

export async function POST(request: Request, { params }: { params: Promise<{ puuid: string }> }) {
  const { puuid } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const count = typeof body.count === "number" ? Math.min(Math.max(body.count, 1), 20) : 12;
    const result = await syncSummonerMatches(decodeURIComponent(puuid), count);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: riotErrorMessage(error) }, { status: 400 });
  }
}

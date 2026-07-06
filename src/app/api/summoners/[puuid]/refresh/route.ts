import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { riotErrorMessage } from "@/lib/riot/errors";
import { searchSummoner } from "@/lib/services/summoners";

export async function POST(_request: Request, { params }: { params: Promise<{ puuid: string }> }) {
  const { puuid } = await params;
  try {
    const summoner = await prisma.summoner.findUniqueOrThrow({ where: { puuid: decodeURIComponent(puuid) } });
    const cooldownUntil = summoner.updatedAt.getTime() + 3 * 60 * 1000;
    if (Date.now() < cooldownUntil) {
      return NextResponse.json({ error: "갱신은 유저별 3분에 한 번만 가능합니다.", cooldownUntil }, { status: 429 });
    }
    const result = await searchSummoner(`${summoner.gameName}#${summoner.tagLine}`, true);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: riotErrorMessage(error) }, { status: 400 });
  }
}

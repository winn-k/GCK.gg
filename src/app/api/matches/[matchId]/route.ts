import { NextResponse } from "next/server";
import { riotErrorMessage } from "@/lib/riot/errors";
import { getStoredOrFetchedMatch } from "@/lib/services/matches";

export async function GET(_request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  try {
    const match = await getStoredOrFetchedMatch(decodeURIComponent(matchId));
    return NextResponse.json(match);
  } catch (error) {
    return NextResponse.json({ error: riotErrorMessage(error) }, { status: 400 });
  }
}

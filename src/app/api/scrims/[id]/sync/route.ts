import { NextResponse } from "next/server";
import { riotErrorMessage } from "@/lib/riot/errors";
import { syncScrimMatch } from "@/lib/services/scrims";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const scrim = await syncScrimMatch(Number(id));
    return NextResponse.json({ scrim });
  } catch (error) {
    return NextResponse.json({ error: riotErrorMessage(error) }, { status: 400 });
  }
}

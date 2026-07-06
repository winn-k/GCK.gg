import { NextRequest, NextResponse } from "next/server";
import { assertAdminPassword } from "@/lib/auth";
import { riotErrorMessage } from "@/lib/riot/errors";
import { issueTournamentCode } from "@/lib/services/scrims";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    assertAdminPassword(body.adminPassword);
    const scrim = await issueTournamentCode(Number(id));
    return NextResponse.json({ scrim });
  } catch (error) {
    return NextResponse.json({ error: riotErrorMessage(error) }, { status: 400 });
  }
}

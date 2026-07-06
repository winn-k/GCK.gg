import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { riotErrorMessage } from "@/lib/riot/errors";
import { searchSummoner } from "@/lib/services/summoners";

const searchSchema = z.object({
  riotId: z.string().min(3),
  force: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const riotId = request.nextUrl.searchParams.get("riotId") ?? "";
  return handleSearch({ riotId });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return handleSearch(body);
}

async function handleSearch(input: unknown) {
  try {
    const data = searchSchema.parse(input);
    const result = await searchSummoner(data.riotId, data.force);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: riotErrorMessage(error) }, { status: 400 });
  }
}

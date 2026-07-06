import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { riotErrorMessage } from "@/lib/riot/errors";
import { createScrim } from "@/lib/services/scrims";

const scrimSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
  adminPassword: z.string().optional().nullable(),
  teams: z
    .array(
      z.object({
        teamName: z.string().min(1),
        players: z.string().optional().default(""),
      }),
    )
    .optional(),
});

export async function GET() {
  const scrims = await prisma.scrim.findMany({ orderBy: { updatedAt: "desc" }, include: { participants: true } });
  return NextResponse.json(scrims);
}

export async function POST(request: NextRequest) {
  try {
    const data = scrimSchema.parse(await request.json());
    assertAdminPassword(data.adminPassword);
    const scrim = await createScrim({
      title: data.title,
      description: data.description ?? undefined,
      scheduledAt: data.scheduledAt ?? undefined,
      teams: data.teams,
    });
    return NextResponse.json({ scrim });
  } catch (error) {
    return NextResponse.json({ error: riotErrorMessage(error) }, { status: 400 });
  }
}

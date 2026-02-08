import { EventType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const profileId = body.profileId as string;
  const eventType = body.eventType as EventType;

  if (!profileId || !["PROFILE_VIEW", "WHATSAPP_CLICK", "CALL_CLICK"].includes(eventType)) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  await prisma.analyticsEvent.create({
    data: {
      handymanProfileId: profileId,
      eventType
    }
  });

  return NextResponse.json({ ok: true });
}

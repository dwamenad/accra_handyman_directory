import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const form = await req.formData();
  const profileId = form.get("profileId")?.toString() || "";

  const profile = await prisma.handymanProfile.findUnique({ where: { id: profileId } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Marketplace hook placeholder: integrate email/SMS notification here.
  return NextResponse.redirect(new URL(`/handyman/${profile.slug}?quote=sent`, req.url));
}

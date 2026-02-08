import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const code = form.get("code")?.toString();

  if (code !== "123456") {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { phoneVerified: true } });

  if (session.user.role === "HANDYMAN") return NextResponse.redirect(new URL("/dashboard", req.url));
  return NextResponse.redirect(new URL("/", req.url));
}

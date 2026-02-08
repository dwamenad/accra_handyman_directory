import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const form = await req.formData();
  const phone = form.get("phone")?.toString() || "";
  const password = form.get("password")?.toString() || "";

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  await createSession(user.id, user.role);
  if (user.role === "HANDYMAN") return NextResponse.redirect(new URL("/dashboard", req.url));
  if (user.role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
  return NextResponse.redirect(new URL("/", req.url));
}

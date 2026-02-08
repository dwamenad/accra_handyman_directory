import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  const form = await req.formData();
  const role = form.get("role")?.toString() as Role;
  const name = form.get("name")?.toString() || "";
  const phone = form.get("phone")?.toString() || "";
  const email = form.get("email")?.toString() || undefined;
  const password = form.get("password")?.toString() || "";
  const businessName = form.get("businessName")?.toString() || name;

  if (!name || !phone || !password || !["CUSTOMER", "HANDYMAN"].includes(role)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: "Phone already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, phone, email, passwordHash, role }
  });

  if (role === "HANDYMAN") {
    const base = slugify(businessName || name);
    let slug = base || `handyman-${user.id.slice(-6)}`;
    let n = 1;
    while (await prisma.handymanProfile.findUnique({ where: { slug } })) {
      slug = `${base}-${n++}`;
    }

    await prisma.handymanProfile.create({
      data: {
        userId: user.id,
        slug,
        businessName,
        publicPhone: phone,
        listingStatus: "DRAFT"
      }
    });
  }

  await createSession(user.id, role);
  return NextResponse.redirect(new URL("/auth/verify", req.url));
}

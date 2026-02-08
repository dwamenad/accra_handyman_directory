import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireAuth("ADMIN");
  const form = await req.formData();

  const suspend = form.get("suspend")?.toString() === "true";
  await prisma.user.update({ where: { id: params.id }, data: { suspended: suspend } });

  return NextResponse.redirect(new URL("/admin", req.url));
}

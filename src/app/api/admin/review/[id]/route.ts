import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireAuth("ADMIN");

  await prisma.review.update({
    where: { id: params.id },
    data: { removedByAdmin: true }
  });

  return NextResponse.redirect(new URL("/admin", req.url));
}

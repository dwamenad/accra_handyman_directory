import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { reviewTagOptions } from "@/lib/constants";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Login as customer" }, { status: 401 });
  if (!session.user.phoneVerified) return NextResponse.json({ error: "Phone verification required" }, { status: 400 });

  const form = await req.formData();
  const handymanProfileId = form.get("handymanProfileId")?.toString() || "";
  const areaName = form.get("areaName")?.toString() || "";
  const serviceTypeId = form.get("serviceTypeId")?.toString() || null;
  const rating = Number(form.get("rating")?.toString() || "0");
  const text = form.get("text")?.toString() || null;
  const tags = form.getAll("tags").map((x) => x.toString()).filter((x) => reviewTagOptions.includes(x));

  if (!handymanProfileId || !areaName || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid review payload" }, { status: 400 });
  }

  const area = await prisma.area.upsert({
    where: { name: areaName },
    update: {},
    create: { name: areaName }
  });

  const existing = await prisma.review.findFirst({
    where: {
      customerId: session.user.id,
      handymanProfileId,
      serviceTypeId,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }
  });

  if (existing) {
    return NextResponse.json({ error: "Only one review per job type every 30 days" }, { status: 429 });
  }

  const recentReviewCount = await prisma.review.count({
    where: {
      customerId: session.user.id,
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }
    }
  });

  if (recentReviewCount >= 3) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  await prisma.review.create({
    data: {
      customerId: session.user.id,
      handymanProfileId,
      serviceTypeId,
      areaId: area.id,
      rating,
      tagsCsv: tags.join(","),
      text
    }
  });

  const profile = await prisma.handymanProfile.findUnique({ where: { id: handymanProfileId } });
  return NextResponse.redirect(new URL(`/handyman/${profile?.slug || ""}`, req.url));
}

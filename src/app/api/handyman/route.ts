import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await requireAuth("HANDYMAN");
  const form = await req.formData();

  const profileId = form.get("profileId")?.toString() || "";
  const serviceName = form.get("serviceName")?.toString() || "";
  const minPrice = form.get("minPrice")?.toString();
  const maxPrice = form.get("maxPrice")?.toString();
  const notes = form.get("notes")?.toString() || undefined;

  const profile = await prisma.handymanProfile.findFirst({ where: { id: profileId, userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const defaultTrade = await prisma.tradeCategory.findFirst();
  if (!defaultTrade) return NextResponse.json({ error: "No trades configured" }, { status: 400 });

  await prisma.handymanTrade.upsert({
    where: { profileId_tradeId: { profileId: profile.id, tradeId: defaultTrade.id } },
    update: {},
    create: { profileId: profile.id, tradeId: defaultTrade.id }
  });

  const serviceType = await prisma.serviceType.upsert({
    where: { tradeId_name: { tradeId: defaultTrade.id, name: serviceName } },
    update: {},
    create: { tradeId: defaultTrade.id, name: serviceName }
  });

  await prisma.handymanService.upsert({
    where: { profileId_serviceTypeId: { profileId: profile.id, serviceTypeId: serviceType.id } },
    update: { notes },
    create: { profileId: profile.id, serviceTypeId: serviceType.id, notes }
  });

  await prisma.pricingItem.create({
    data: {
      profileId: profile.id,
      serviceTypeId: serviceType.id,
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      notes
    }
  });

  return NextResponse.redirect(new URL("/dashboard", req.url));
}

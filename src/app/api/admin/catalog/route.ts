import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  await requireAuth("ADMIN");
  const form = await req.formData();

  const tradeName = form.get("tradeName")?.toString();
  const areaName = form.get("areaName")?.toString();
  const serviceName = form.get("serviceName")?.toString();
  const serviceTradeId = form.get("serviceTradeId")?.toString();

  if (tradeName) {
    await prisma.tradeCategory.upsert({ where: { name: tradeName }, update: {}, create: { name: tradeName } });
  }

  if (areaName) {
    await prisma.area.upsert({ where: { name: areaName }, update: {}, create: { name: areaName } });
  }

  if (serviceName && serviceTradeId) {
    await prisma.serviceType.upsert({
      where: { tradeId_name: { tradeId: serviceTradeId, name: serviceName } },
      update: {},
      create: { tradeId: serviceTradeId, name: serviceName }
    });
  }

  return NextResponse.redirect(new URL("/admin", req.url));
}

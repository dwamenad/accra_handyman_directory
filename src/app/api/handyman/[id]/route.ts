import { ListingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeCompleteness, getListingStatusForSubmission } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const profile = await prisma.handymanProfile.findUnique({
    where: { id: params.id },
    include: { trades: true, services: true, pricingItems: true, photos: true, verification: true }
  });

  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = session.user.role === "HANDYMAN" && profile.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (isAdmin) {
    const moderationAction = form.get("moderationAction")?.toString();
    if (moderationAction && ["DRAFT", "PENDING", "APPROVED", "SUSPENDED"].includes(moderationAction)) {
      await prisma.handymanProfile.update({ where: { id: profile.id }, data: { listingStatus: moderationAction as ListingStatus } });
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    if (form.get("togglePhoneVerified")?.toString() === "true") {
      await prisma.verificationStatus.upsert({
        where: { handymanProfileId: profile.id },
        update: { phoneVerifiedBadge: !profile.verification?.phoneVerifiedBadge },
        create: { handymanProfileId: profile.id, phoneVerifiedBadge: true }
      });
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    if (form.get("toggleIdVerified")?.toString() === "true") {
      await prisma.verificationStatus.upsert({
        where: { handymanProfileId: profile.id },
        update: { idVerifiedBadge: !profile.verification?.idVerifiedBadge },
        create: { handymanProfileId: profile.id, idVerifiedBadge: true }
      });
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    if (form.get("toggleWorkVerified")?.toString() === "true") {
      await prisma.verificationStatus.upsert({
        where: { handymanProfileId: profile.id },
        update: { verifiedWorkBadge: !profile.verification?.verifiedWorkBadge },
        create: { handymanProfileId: profile.id, verifiedWorkBadge: true }
      });
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  if (isOwner) {
    const submitForApproval = form.get("submitForApproval")?.toString() === "true";
    const photoUrl = form.get("photoUrl")?.toString();
    const photoCaption = form.get("photoCaption")?.toString();

    if (photoUrl) {
      await prisma.photo.create({
        data: { profileId: profile.id, url: photoUrl, caption: photoCaption || undefined }
      });
    }

    await prisma.handymanProfile.update({
      where: { id: profile.id },
      data: {
        businessName: form.get("businessName")?.toString() || profile.businessName,
        areasText: form.get("areasText")?.toString() || null,
        about: form.get("about")?.toString() || null,
        weeklyAvailabilityJson: form.get("weeklyAvailabilityJson")?.toString() || null,
        acceptsBookings: form.get("acceptsBookings")?.toString() === "true",
        paymentMethods: form.get("paymentMethods")?.toString() || null,
        requestQuoteEnabled: form.get("requestQuoteEnabled")?.toString() === "true",
        listingStatus: submitForApproval ? getListingStatusForSubmission() : profile.listingStatus,
        profileCompleteness: computeCompleteness({
          about: form.get("about")?.toString() || profile.about,
          areasText: form.get("areasText")?.toString() || profile.areasText,
          weeklyAvailabilityJson: form.get("weeklyAvailabilityJson")?.toString() || profile.weeklyAvailabilityJson,
          photosCount: profile.photos.length + (photoUrl ? 1 : 0),
          servicesCount: profile.services.length,
          pricingCount: profile.pricingItems.length,
          tradesCount: profile.trades.length
        })
      }
    });

    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  await requireAuth("ADMIN");
  return NextResponse.redirect(new URL("/admin", req.url));
}

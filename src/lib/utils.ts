import { ListingStatus, Prisma, Role } from "@prisma/client";

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

export function computeCompleteness(data: {
  about?: string | null;
  areasText?: string | null;
  weeklyAvailabilityJson?: string | null;
  photosCount: number;
  servicesCount: number;
  pricingCount: number;
  tradesCount: number;
}) {
  let score = 20;
  if (data.about) score += 10;
  if (data.areasText) score += 10;
  if (data.weeklyAvailabilityJson) score += 10;
  if (data.photosCount > 0) score += 15;
  if (data.servicesCount > 0) score += 15;
  if (data.pricingCount > 0) score += 10;
  if (data.tradesCount > 0) score += 10;
  return Math.min(100, score);
}

export function getListingStatusForSubmission() {
  return process.env.AUTO_APPROVE_LISTINGS === "true" ? ListingStatus.APPROVED : ListingStatus.PENDING;
}

export function parseRole(input: string): Role | null {
  if (input === "CUSTOMER" || input === "HANDYMAN" || input === "ADMIN") return input;
  return null;
}

export function listingStatusLabel(status: ListingStatus) {
  return status.toLowerCase();
}

export type SearchSort = "relevance" | "highest_rated" | "lowest_price" | "most_reviewed";

export function buildSearchOrder(sort: SearchSort): Prisma.HandymanProfileOrderByWithRelationInput[] {
  if (sort === "lowest_price") {
    return [{ pricingItems: { _count: "desc" } }, { profileCompleteness: "desc" }];
  }
  if (sort === "highest_rated") {
    return [{ profileCompleteness: "desc" }, { createdAt: "desc" }];
  }
  if (sort === "most_reviewed") {
    return [{ reviews: { _count: "desc" } }, { profileCompleteness: "desc" }];
  }
  return [{ profileCompleteness: "desc" }, { createdAt: "desc" }];
}

export function formatGhs(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(value);
}

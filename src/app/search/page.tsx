import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/utils";

type Params = {
  searchParams: {
    q?: string;
    tradeIds?: string;
    areas?: string;
    minPrice?: string;
    maxPrice?: string;
    verifiedOnly?: string;
    minRating?: string;
    sort?: "relevance" | "highest_rated" | "lowest_price" | "most_reviewed";
  };
};

export default async function SearchPage({ searchParams }: Params) {
  const trades = await prisma.tradeCategory.findMany({ orderBy: { name: "asc" } });

  const rawTradeIds = (searchParams.tradeIds || "").split(",").filter(Boolean);
  const areaTokens = (searchParams.areas || "").split(",").map((s) => s.trim()).filter(Boolean);
  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;
  const verifiedOnly = searchParams.verifiedOnly === "true";

  const profiles = await prisma.handymanProfile.findMany({
    where: {
      listingStatus: "APPROVED",
      OR: searchParams.q
        ? [
            { businessName: { contains: searchParams.q } },
            { about: { contains: searchParams.q } },
            { trades: { some: { trade: { name: { contains: searchParams.q } } } } }
          ]
        : undefined,
      trades: rawTradeIds.length
        ? {
            some: {
              tradeId: { in: rawTradeIds }
            }
          }
        : undefined,
      areasText: areaTokens.length
        ? {
            contains: areaTokens[0]
          }
        : undefined,
      verification: verifiedOnly ? { is: { phoneVerifiedBadge: true } } : undefined,
      pricingItems:
        minPrice || maxPrice
          ? {
              some: {
                minPrice: minPrice ? { gte: minPrice } : undefined,
                maxPrice: maxPrice ? { lte: maxPrice } : undefined
              }
            }
          : undefined
    },
    include: {
      trades: { include: { trade: true } },
      pricingItems: { orderBy: { minPrice: "asc" }, take: 1 },
      verification: true,
      reviews: { where: { removedByAdmin: false }, select: { rating: true } }
    },
    take: 60
  });

  const filtered = profiles
    .map((profile) => {
      const ratings = profile.reviews.map((r) => r.rating);
      const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      return { profile, avgRating, reviewCount: ratings.length };
    })
    .filter((x) => (searchParams.minRating ? x.avgRating >= Number(searchParams.minRating) : true))
    .sort((a, b) => {
      if (searchParams.sort === "most_reviewed") return b.reviewCount - a.reviewCount;
      if (searchParams.sort === "lowest_price") {
        return (a.profile.pricingItems[0]?.minPrice || Infinity) - (b.profile.pricingItems[0]?.minPrice || Infinity);
      }
      if (searchParams.sort === "highest_rated") return b.avgRating - a.avgRating;
      return b.profile.profileCompleteness - a.profile.profileCompleteness || b.avgRating - a.avgRating;
    });

  return (
    <div style={{ padding: "16px 0 24px" }} className="grid">
      <h1>Search Handymen</h1>
      <form className="card grid grid-3" action="/search">
        <input name="q" placeholder="Search by service/trade" defaultValue={searchParams.q || ""} />
        <select name="tradeIds" defaultValue={searchParams.tradeIds || ""}>
          <option value="">All trades</option>
          {trades.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input name="areas" placeholder="Area(s), comma separated" defaultValue={searchParams.areas || ""} />
        <input name="minPrice" type="number" min={0} placeholder="Min GHS" defaultValue={searchParams.minPrice || ""} />
        <input name="maxPrice" type="number" min={0} placeholder="Max GHS" defaultValue={searchParams.maxPrice || ""} />
        <select name="minRating" defaultValue={searchParams.minRating || ""}>
          <option value="">Any rating</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
          <option value="4.5">4.5+</option>
        </select>
        <select name="sort" defaultValue={searchParams.sort || "relevance"}>
          <option value="relevance">Relevance</option>
          <option value="highest_rated">Highest rated</option>
          <option value="lowest_price">Lowest price</option>
          <option value="most_reviewed">Most reviewed</option>
        </select>
        <label className="row">
          <input name="verifiedOnly" value="true" type="checkbox" defaultChecked={searchParams.verifiedOnly === "true"} style={{ width: 14 }} />
          Verified only
        </label>
        <button type="submit">Apply</button>
      </form>

      <div className="grid grid-2">
        {filtered.map(({ profile, avgRating, reviewCount }) => (
          <article key={profile.id} className="card">
            <h3>{profile.businessName}</h3>
            <p className="small">{profile.trades.map((t) => t.trade.name).join(", ")}</p>
            <p>{profile.areasText || "Accra"}</p>
            <div className="badges">
              {profile.verification?.phoneVerifiedBadge && <span className="badge">Phone Verified</span>}
              {profile.verification?.idVerifiedBadge && <span className="badge">ID Verified</span>}
              {avgRating >= 4.5 && reviewCount >= 5 && <span className="badge">Top Rated</span>}
            </div>
            <p>
              {avgRating ? avgRating.toFixed(1) : "New"} ({reviewCount} reviews)
            </p>
            <p>From {formatGhs(profile.pricingItems[0]?.minPrice)}</p>
            <div className="row">
              <Link href={`/handyman/${profile.slug}`} className="btn" style={{ padding: "8px 12px", width: "auto" }}>
                View profile
              </Link>
              <a href={`https://wa.me/${profile.publicPhone.replace(/\D/g, "")}`} className="btn btn-secondary" style={{ padding: "8px 12px", width: "auto" }}>
                WhatsApp
              </a>
              <a href={`tel:${profile.publicPhone}`} className="btn" style={{ padding: "8px 12px", width: "auto" }}>
                Call
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/utils";

export default async function HomePage() {
  const categories = await prisma.tradeCategory.findMany({ orderBy: { name: "asc" }, take: 8 });
  const topRated = await prisma.handymanProfile.findMany({
    where: { listingStatus: "APPROVED" },
    include: {
      user: true,
      verification: true,
      reviews: { where: { removedByAdmin: false }, select: { rating: true } },
      pricingItems: { take: 1, orderBy: { minPrice: "asc" } }
    },
    take: 6
  });

  const topRatedMapped = topRated
    .map((p) => {
      const ratings = p.reviews.map((r) => r.rating);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      return { p, avg };
    })
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 4);

  return (
    <div className="grid" style={{ gap: 18, padding: "16px 0 24px" }}>
      <section className="card">
        <h1>Find trusted handymen across Accra</h1>
        <p className="small">Search by trade, area, pricing, availability, and verification badges.</p>
        <form action="/search" className="grid grid-3" style={{ marginTop: 10 }}>
          <input name="q" placeholder="What do you need?" />
          <input name="areas" placeholder="Where in Accra?" />
          <button type="submit">Find a handyman</button>
        </form>
        <div className="row" style={{ marginTop: 10 }}>
          <Link href="/search" className="btn" style={{ width: "auto", padding: "10px 16px" }}>
            Browse Directory
          </Link>
          <Link href="/auth/signup-handyman" className="btn btn-secondary" style={{ width: "auto", padding: "10px 16px" }}>
            Join as a handyman
          </Link>
        </div>
      </section>

      <section>
        <h2>Popular Trades</h2>
        <div className="grid grid-3">
          {categories.map((c) => (
            <Link key={c.id} className="card" href={`/search?tradeIds=${c.id}`}>
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2>Top Rated Near You</h2>
        <div className="grid grid-2">
          {topRatedMapped.map(({ p, avg }) => (
            <article key={p.id} className="card">
              <h3>{p.businessName}</h3>
              <p className="small">{p.areasText || "Accra"}</p>
              <div className="badges">
                {p.verification?.phoneVerifiedBadge && <span className="badge">Phone Verified</span>}
                {p.verification?.idVerifiedBadge && <span className="badge">ID Verified</span>}
              </div>
              <p>
                Rating: {avg ? avg.toFixed(1) : "New"} ({p.reviews.length})
              </p>
              <p>From {formatGhs(p.pricingItems[0]?.minPrice)}</p>
              <Link href={`/handyman/${p.slug}`} className="btn" style={{ marginTop: 8 }}>
                View profile
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ContactButtons } from "@/components/ContactButtons";
import { ProfileViewTracker } from "@/components/ProfileViewTracker";
import { reviewTagOptions } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/utils";

export default async function HandymanProfilePage({ params }: { params: { slug: string } }) {
  const session = await getSession();

  const profile = await prisma.handymanProfile.findUnique({
    where: { slug: params.slug },
    include: {
      user: true,
      trades: { include: { trade: true } },
      pricingItems: { include: { serviceType: true } },
      services: { include: { serviceType: true } },
      photos: true,
      verification: true,
      reviews: {
        where: { removedByAdmin: false },
        include: { customer: true, area: true, serviceType: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!profile || (profile.listingStatus !== "APPROVED" && session?.user.role !== "ADMIN")) {
    notFound();
  }

  const ratingAvg = profile.reviews.length
    ? profile.reviews.reduce((sum, r) => sum + r.rating, 0) / profile.reviews.length
    : 0;

  return (
    <div className="grid" style={{ gap: 14, padding: "16px 0 24px" }}>
      <ProfileViewTracker profileId={profile.id} />
      <section className="card">
        <h1>{profile.businessName}</h1>
        <p>{profile.trades.map((t) => t.trade.name).join(", ")}</p>
        <p className="small">{profile.areasText || "Accra"}</p>
        <div className="badges">
          {profile.verification?.phoneVerifiedBadge && <span className="badge">Phone Verified</span>}
          {profile.verification?.idVerifiedBadge && <span className="badge">ID Verified</span>}
          {profile.verification?.verifiedWorkBadge && <span className="badge">Verified Work</span>}
        </div>
        <p>
          Rating: {ratingAvg ? ratingAvg.toFixed(1) : "New"} ({profile.reviews.length} reviews)
        </p>
        <p>{profile.about || "No bio yet."}</p>
        <ContactButtons profileId={profile.id} publicPhone={profile.publicPhone} />
      </section>

      <section className="card">
        <h2>Services & Pricing</h2>
        <div className="grid grid-2">
          {profile.pricingItems.map((item) => (
            <div key={item.id}>
              <strong>{item.serviceType.name}</strong>
              <p>
                {formatGhs(item.minPrice)} - {formatGhs(item.maxPrice)}
              </p>
              {item.notes && <p className="small">{item.notes}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Photos</h2>
        <div className="grid grid-3">
          {profile.photos.map((photo) => (
            <img key={photo.id} src={photo.url} alt={photo.caption || "work photo"} style={{ width: "100%", borderRadius: 12, maxHeight: 180, objectFit: "cover" }} />
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Reviews</h2>
        <div className="grid">
          {profile.reviews.map((r) => (
            <article key={r.id} className="card">
              <strong>{r.rating}/5</strong>
              <p className="small">
                {r.serviceType?.name || "General job"} · {r.area?.name || "Accra"} · {new Date(r.createdAt).toLocaleDateString()}
              </p>
              <p className="small">Tags: {r.tagsCsv}</p>
              {r.text && <p>{r.text}</p>}
              <p className="small">By {r.customer.name}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Leave a review</h2>
        {session?.user.role === "CUSTOMER" && session.user.phoneVerified ? (
          <form action="/api/reviews" method="post" className="grid">
            <input type="hidden" name="handymanProfileId" value={profile.id} />
            <select name="serviceTypeId">
              <option value="">Select job type</option>
              {profile.services.map((s) => (
                <option key={s.id} value={s.serviceTypeId}>
                  {s.serviceType.name}
                </option>
              ))}
            </select>
            <input name="areaName" placeholder="Area" required />
            <select name="rating" required>
              <option value="">Rating</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <select name="tags" multiple size={4}>
              {reviewTagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <textarea name="text" maxLength={300} placeholder="Optional short review" />
            <button type="submit">Submit review</button>
          </form>
        ) : (
          <p>
            <Link href="/auth/login">Login as a verified customer</Link> to leave a review.
          </p>
        )}
      </section>

      {profile.requestQuoteEnabled && (
        <section className="card">
          <h2>Request quote (optional)</h2>
          <form method="post" action="/api/request-quote" className="grid">
            <input type="hidden" name="profileId" value={profile.id} />
            <input name="name" placeholder="Your name" required />
            <input name="phone" placeholder="Phone" required />
            <textarea name="message" placeholder="What do you need done?" maxLength={400} required />
            <button type="submit">Send request</button>
          </form>
          <p className="small">No payments or booking. Sends a lead to handyman contact channel.</p>
        </section>
      )}
    </div>
  );
}

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeCompleteness, formatGhs, getListingStatusForSubmission } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireAuth("HANDYMAN");
  const user = session.user;

  const profile = await prisma.handymanProfile.findUnique({
    where: { userId: user.id },
    include: {
      trades: true,
      services: { include: { serviceType: true } },
      pricingItems: { include: { serviceType: true } },
      photos: true,
      reviews: { where: { removedByAdmin: false } },
      analyticsEvents: true
    }
  });

  if (!profile) redirect("/");

  const analytics = {
    profileViews: profile.analyticsEvents.filter((e) => e.eventType === "PROFILE_VIEW").length,
    whatsappClicks: profile.analyticsEvents.filter((e) => e.eventType === "WHATSAPP_CLICK").length,
    callClicks: profile.analyticsEvents.filter((e) => e.eventType === "CALL_CLICK").length
  };

  const avgRating = profile.reviews.length
    ? profile.reviews.reduce((s, r) => s + r.rating, 0) / profile.reviews.length
    : 0;

  return (
    <div className="grid" style={{ padding: "16px 0 24px", gap: 14 }}>
      <h1>Handyman Dashboard</h1>
      <section className="grid grid-3">
        <article className="card"><div className="kpi">{analytics.profileViews}</div><div className="small">Profile views</div></article>
        <article className="card"><div className="kpi">{analytics.whatsappClicks}</div><div className="small">WhatsApp clicks</div></article>
        <article className="card"><div className="kpi">{analytics.callClicks}</div><div className="small">Call clicks</div></article>
        <article className="card"><div className="kpi">{profile.reviews.length}</div><div className="small">Review count</div></article>
        <article className="card"><div className="kpi">{avgRating ? avgRating.toFixed(1) : "-"}</div><div className="small">Average rating</div></article>
        <article className="card"><div className="kpi">{profile.listingStatus}</div><div className="small">Status</div></article>
      </section>

      <section className="card">
        <h2>Edit listing</h2>
        <form action={`/api/handyman/${profile.id}`} method="post" className="grid">
          <input name="businessName" defaultValue={profile.businessName} required />
          <input name="areasText" defaultValue={profile.areasText || ""} placeholder="Areas served" />
          <textarea name="about" defaultValue={profile.about || ""} placeholder="About" maxLength={500} />
          <textarea
            name="weeklyAvailabilityJson"
            defaultValue={profile.weeklyAvailabilityJson || '{"weekdays":"8am-6pm","weekends":"on request"}'}
            placeholder='{"weekdays":"8am-6pm"}'
          />
          <label className="row">
            <input name="acceptsBookings" type="checkbox" value="true" defaultChecked={profile.acceptsBookings} style={{ width: 14 }} />
            Accepts bookings (future hook)
          </label>
          <input name="paymentMethods" defaultValue={profile.paymentMethods || ""} placeholder="Payment methods (future hook)" />
          <label className="row">
            <input name="requestQuoteEnabled" type="checkbox" value="true" defaultChecked={profile.requestQuoteEnabled} style={{ width: 14 }} />
            Enable request quote form
          </label>
          <button type="submit">Save changes</button>
        </form>
      </section>

      <section className="card">
        <h2>Services & pricing</h2>
        <form action="/api/handyman" method="post" className="grid grid-2">
          <input type="hidden" name="profileId" value={profile.id} />
          <input name="serviceName" placeholder="Service name" required />
          <input name="minPrice" type="number" min={0} placeholder="Min price" />
          <input name="maxPrice" type="number" min={0} placeholder="Max price" />
          <input name="notes" placeholder="Notes" />
          <button type="submit">Add pricing item</button>
        </form>
        <div className="grid" style={{ marginTop: 10 }}>
          {profile.pricingItems.map((p) => (
            <div key={p.id} className="row" style={{ justifyContent: "space-between" }}>
              <span>{p.serviceType.name}</span>
              <span>{formatGhs(p.minPrice)} - {formatGhs(p.maxPrice)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Photos</h2>
        <form action={`/api/handyman/${profile.id}`} method="post" className="grid grid-2">
          <input name="photoUrl" placeholder="https://..." />
          <input name="photoCaption" placeholder="Caption" />
          <button type="submit">Add photo</button>
        </form>
        <div className="grid grid-3" style={{ marginTop: 10 }}>
          {profile.photos.map((photo) => (
            <img key={photo.id} src={photo.url} alt={photo.caption || "work"} style={{ width: "100%", borderRadius: 10, maxHeight: 140, objectFit: "cover" }} />
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Submit for approval</h2>
        <p className="small">Current status: {profile.listingStatus}</p>
        <form action={`/api/handyman/${profile.id}`} method="post">
          <input type="hidden" name="submitForApproval" value="true" />
          <button type="submit">Submit ({getListingStatusForSubmission()})</button>
        </form>
      </section>
    </div>
  );
}

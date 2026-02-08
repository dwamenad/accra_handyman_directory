import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  await requireAuth("ADMIN");

  const pendingListings = await prisma.handymanProfile.findMany({
    where: { listingStatus: "PENDING" },
    include: { user: true, verification: true, reviews: { where: { removedByAdmin: false } } },
    orderBy: { updatedAt: "desc" }
  });

  const report = {
    profilesByTrade: await prisma.handymanTrade.groupBy({ by: ["tradeId"], _count: true }),
    profileCount: await prisma.handymanProfile.count(),
    activeUsers: await prisma.user.count({ where: { suspended: false } }),
    reviewVolume: await prisma.review.count({ where: { removedByAdmin: false } })
  };

  const trades = await prisma.tradeCategory.findMany();
  const areas = await prisma.area.findMany({ orderBy: { name: "asc" }, take: 100 });
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  const reviews = await prisma.review.findMany({
    where: { removedByAdmin: false },
    include: { customer: true, profile: true },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return (
    <div className="grid" style={{ gap: 14, padding: "16px 0 24px" }}>
      <h1>Admin Panel</h1>
      <section className="grid grid-3">
        <article className="card"><div className="kpi">{report.profileCount}</div><div className="small">Listings</div></article>
        <article className="card"><div className="kpi">{report.activeUsers}</div><div className="small">Active users</div></article>
        <article className="card"><div className="kpi">{report.reviewVolume}</div><div className="small">Reviews</div></article>
      </section>

      <section className="card">
        <h2>Listings Queue</h2>
        <div className="grid">
          {pendingListings.map((p) => (
            <article key={p.id} className="card">
              <h3>{p.businessName}</h3>
              <p className="small">Owner: {p.user.name} ({p.user.phone})</p>
              <div className="row">
                <form action={`/api/handyman/${p.id}`} method="post">
                  <input type="hidden" name="moderationAction" value="APPROVED" />
                  <button type="submit">Approve</button>
                </form>
                <form action={`/api/handyman/${p.id}`} method="post">
                  <input type="hidden" name="moderationAction" value="SUSPENDED" />
                  <button type="submit">Suspend</button>
                </form>
                <form action={`/api/handyman/${p.id}`} method="post">
                  <input type="hidden" name="moderationAction" value="PENDING" />
                  <button type="submit">Request edits</button>
                </form>
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <form action={`/api/handyman/${p.id}`} method="post" className="row">
                  <input type="hidden" name="togglePhoneVerified" value="true" />
                  <button type="submit">Toggle Phone Badge</button>
                </form>
                <form action={`/api/handyman/${p.id}`} method="post" className="row">
                  <input type="hidden" name="toggleIdVerified" value="true" />
                  <button type="submit">Toggle ID Badge</button>
                </form>
                <form action={`/api/handyman/${p.id}`} method="post" className="row">
                  <input type="hidden" name="toggleWorkVerified" value="true" />
                  <button type="submit">Toggle Work Badge</button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Listings by Trade</h2>
        <div className="grid grid-2">
          {report.profilesByTrade.map((item) => {
            const trade = trades.find((t) => t.id === item.tradeId);
            return (
              <div key={item.tradeId} className="row" style={{ justifyContent: "space-between" }}>
                <span>{trade?.name || "Unknown"}</span>
                <span>{item._count}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2>Catalog Management</h2>
        <div className="grid grid-3">
          <form action="/api/admin/catalog" method="post" className="grid">
            <input name="tradeName" placeholder="Add trade category" required />
            <button type="submit">Add trade</button>
          </form>
          <form action="/api/admin/catalog" method="post" className="grid">
            <input name="areaName" placeholder="Add area/neighborhood" required />
            <button type="submit">Add area</button>
          </form>
          <form action="/api/admin/catalog" method="post" className="grid">
            <select name="serviceTradeId" required>
              <option value="">Select trade</option>
              {trades.map((trade) => (
                <option key={trade.id} value={trade.id}>
                  {trade.name}
                </option>
              ))}
            </select>
            <input name="serviceName" placeholder="Add service type" required />
            <button type="submit">Add service</button>
          </form>
        </div>
        <p className="small" style={{ marginTop: 10 }}>
          Areas seeded: {areas.slice(0, 8).map((a) => a.name).join(", ")}
          {areas.length > 8 ? "..." : ""}
        </p>
      </section>

      <section className="card">
        <h2>User Moderation</h2>
        <div className="grid">
          {users.map((user) => (
            <div key={user.id} className="row" style={{ justifyContent: "space-between" }}>
              <span>
                {user.name} ({user.role}) {user.suspended ? "· Suspended" : ""}
              </span>
              {user.role !== "ADMIN" && (
                <form action={`/api/admin/user/${user.id}`} method="post">
                  <input type="hidden" name="suspend" value={user.suspended ? "false" : "true"} />
                  <button type="submit">{user.suspended ? "Unsuspend" : "Suspend"}</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Review Moderation</h2>
        <div className="grid">
          {reviews.map((r) => (
            <article key={r.id} className="card">
              <p>
                <strong>{r.profile.businessName}</strong> · {r.rating}/5
              </p>
              <p className="small">By {r.customer.name} · {new Date(r.createdAt).toLocaleDateString()}</p>
              {r.text && <p>{r.text}</p>}
              <form action={`/api/admin/review/${r.id}`} method="post">
                <button type="submit">Remove review</button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

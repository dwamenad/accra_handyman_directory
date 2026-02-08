# Accra Handyman Directory (Directory-first MVP)

Directory-first MVP for finding and contacting handymen in Accra, with moderation, credibility-gated reviews, and analytics hooks.

## Stack

- Next.js 14 (App Router)
- Prisma + SQLite
- Cookie/JWT auth (phone-first flow)

## Runtime Requirements

- Node.js `>=20.9.0` (recommended: Node 20 LTS)
- npm `>=10`

## Features Implemented

- Customer browsing and search without login
- Customer login/signup with phone verification gate for reviews
- Handyman signup + dashboard + listing submission workflow
- Public handyman profiles with services, pricing, photos, availability, verification badges, review context
- Review credibility rules:
  - verified customer only
  - one review per customer per handyman per job type per 30 days
  - basic rate limit (max 3 reviews per 10 minutes)
- Admin panel:
  - listing queue moderation
  - verification badge toggles (phone/id/work)
  - review removal
  - user suspension
  - catalog management (trades/areas/service types)
  - summary stats
- Analytics tracking:
  - `profile_view`
  - `whatsapp_click`
  - `call_click`
- Future hooks present in profile model/UI:
  - `acceptsBookings` (false by default)
  - `paymentMethods`
  - optional `requestQuoteEnabled` form

## Quick Start

1. Install dependencies:

```bash
nvm use || nvm install 20
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Generate Prisma client + migrate + seed:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run db:seed
```

4. Run app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Seeded Admin

- Phone: `+233000000001`
- Password: `admin1234`

## Notes

- OTP is currently demo-only (`123456`). Replace with real SMS provider.
- Search ranking is currently pragmatic MVP logic and should be moved to weighted/indexed search later.
- No payments or booking implemented (intentionally).

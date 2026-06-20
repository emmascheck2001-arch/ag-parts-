# EzParts — Go-Live Runbook

What's code-complete vs. what only **you** can flip to take real money. Work top to bottom.

---

## ✅ Already built (code-complete this session)
- **Fitment brain** — 265 machines / 13k parts / 34k fitments in Supabase.
- **Supply side** — `dealers` + `inventory` tables; "List a Part" writes real inventory (`save-inventory`); each seller carries its Stripe account.
- **Take-rate** — 8% platform fee (`PLATFORM_FEE_RATE` in `src/lib/marketplace.js`), applied as a Stripe Connect `application_fee` routed to the selling dealer.
- **Orders** — persisted to DB on checkout (`save-order`); payment confirmed authoritatively by `stripe-webhook`; dealer sees them in the Dealer Dashboard (`get-orders`).

---

## Required steps to go live (only you can do these)

### 1. Create the DB tables  (Supabase → SQL Editor)
Run each file's contents:
- `FITMENT_SETUP.sql` (if the fitment tables aren't already there) — fitment brain.
- `DEALER_INVENTORY_SCHEMA.sql` — dealers, inventory, orders. *(Drops the empty legacy `orders` table first — safe, it's empty.)*

### 2. (Optional) Seed demo supply so the store isn't empty
```
node scripts/seed_dealers.mjs       # 3 demo dealers + inventory on consumable parts
```
Demo dealers have no real Stripe account (payouts won't route) — they make the storefront browsable/testable end-to-end. Replace with real dealers (step 4).

### 3. Stripe — go live
- In Netlify env vars set: `STRIPE_SECRET_KEY` = your **live** `sk_live_…`.
- In `.env` (and Netlify) set `VITE_STRIPE_PUBLISHABLE_KEY` = **live** `pk_live_…` (currently `pk_test`).
- Register a webhook in the Stripe dashboard → URL `https://<your-site>/.netlify/functions/stripe-webhook`, events `payment_intent.succeeded` and `payment_intent.payment_failed`. Put the signing secret in Netlify as `STRIPE_WEBHOOK_SECRET` = `whsec_…`.

### 4. Onboard ≥1 real dealer
- Dealer goes through the in-app **Dealer → Connect onboarding** (uses `create-connect-account`). This returns an `acct_…` and, once their bank/identity clears, payouts are enabled.
- Set that dealer's `dealers.stripe_account_id` = `acct_…` and `status` = `active` (the List-a-Part flow does this automatically if the dealer onboarded in the same browser; otherwise update the row).

### 5. Redeploy
- Netlify → Deploys → Trigger deploy. (Ships the storefront + functions with the new env.)

After 1–5: a farmer can find a part → buy it → the dealer is paid → EzParts keeps 8% → the order is recorded and shown to the dealer. **That's a real transaction.**

---

## ⚠️ Before real customers (Tier 2 — trust/compliance, still TODO)
- **Auth** — Supabase Auth for farmers + dealers. Today `get-orders` is **not** auth-scoped (any caller can read orders) and dealers can't manage only-their inventory. Gate these before launch.
- **Data verification** — everything is `verified=false`; the 5 scanned Hagie models are OCR'd (lower confidence). Wrong part = returns/liability. Add a review pass.
- **Sales tax** (Stripe Tax), **returns/refunds** flow, **ToS + liability disclaimer**, and the **data-provenance/IP** rule (don't ingest scraped licensed catalogs).

## 💰 Profitability (Tier 3 — business, not code)
- Revenue mechanism is wired (8% take). Profit = **GMV × 8% − Stripe fees − ops − CAC**.
- The real lever is **liquidity**: enough dealers listing real stock + enough farmers buying. Start narrow (one region/crop/dealer cluster you already know), prove a few real orders, then widen.

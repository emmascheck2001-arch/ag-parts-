-- ============================================================================
-- PartFinder AG — Marketplace / Stripe Connect schema extension
-- Run AFTER SUPABASE_SCHEMA.sql. Adds the fields needed for the model where:
--   • the dealer is the seller (Stripe Connect connected account),
--   • the farmer pays the dealer's price (+ shipping if shipped),
--   • the platform takes a commission on the part price via an application fee,
--   • fulfillment is either ship-to-farm or pickup-at-the-dealer.
-- All statements are additive and safe to re-run.
-- ============================================================================

-- ── Dealers (suppliers) become Connect sellers with a pickup location ──────────
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS stripe_account_id  TEXT;            -- acct_… (Connect)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payouts_enabled    BOOLEAN DEFAULT FALSE; -- onboarding complete?
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS supports_shipping  BOOLEAN DEFAULT TRUE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS supports_pickup    BOOLEAN DEFAULT TRUE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address            TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS phone              TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS hours              TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS lat                DECIMAL(9,6);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS lng                DECIMAL(9,6);

-- ── Orders carry one dealer, a fulfillment choice, and the money split ─────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS supplier_id            BIGINT REFERENCES suppliers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_type       TEXT DEFAULT 'ship'      -- 'ship' | 'pickup'
  CHECK (fulfillment_type IN ('ship', 'pickup'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_location        TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal               DECIMAL(10,2);           -- part price(s)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_total         DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee           DECIMAL(10,2);           -- our commission
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dealer_payout          DECIMAL(10,2);           -- what the dealer receives
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status         TEXT DEFAULT 'pending'   -- pending|paid|failed|refunded
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- Fulfillment status distinct from payment status (kept simple for now):
--   ship:   awaiting → shipped → delivered
--   pickup: awaiting → ready → picked_up
-- Uses the existing orders.status TEXT column.

CREATE INDEX IF NOT EXISTS idx_orders_supplier ON orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Lemon Squeezy payment provider fields on orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(32) NOT NULL DEFAULT 'lemonsqueezy';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS external_checkout_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_external_checkout_id
  ON orders (external_checkout_id)
  WHERE external_checkout_id IS NOT NULL;

COMMENT ON COLUMN orders.payment_provider IS 'lemonsqueezy | stripe (legacy)';
COMMENT ON COLUMN orders.external_checkout_id IS 'Lemon Squeezy order/subscription id for webhook idempotency';

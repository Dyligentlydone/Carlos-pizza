-- Idempotency for Retell order submissions.
-- Ensures the same call_id cannot create two orders even under retries.
-- Uses a partial unique index so multiple rows with NULL call_id (manual/dashboard orders)
-- are still allowed.

CREATE UNIQUE INDEX IF NOT EXISTS orders_call_id_unique
  ON public.orders (call_id)
  WHERE call_id IS NOT NULL;


-- Backfill: move previous owner's email/phone to previous_ fields and clear current ones
-- Only for customers where owner was already changed (previous_first_name is set)
-- and previous_email/previous_phone haven't been populated yet
UPDATE public.customers
SET
  previous_email = email,
  previous_phone = phone,
  email = NULL,
  phone = NULL,
  updated_at = now()
WHERE previous_first_name IS NOT NULL
  AND previous_email IS NULL
  AND (email IS NOT NULL OR phone IS NOT NULL);

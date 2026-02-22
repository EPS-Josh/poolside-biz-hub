
-- Fix #1 & #4: Recreate calendar_integrations_decrypted view with security_invoker
-- This makes the view respect the RLS policies on the underlying calendar_integrations table
DROP VIEW IF EXISTS public.calendar_integrations_decrypted;
CREATE VIEW public.calendar_integrations_decrypted
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  provider,
  decrypt_token(access_token) as access_token,
  decrypt_token(refresh_token) as refresh_token,
  calendar_id,
  is_active,
  is_encrypted,
  last_sync_at,
  token_expires_at,
  created_at,
  updated_at
FROM public.calendar_integrations;

-- Fix #2 & #5: Recreate quickbooks_connections_decrypted view with security_invoker
-- This makes the view respect the RLS policies on the underlying quickbooks_connections table
DROP VIEW IF EXISTS public.quickbooks_connections_decrypted;
CREATE VIEW public.quickbooks_connections_decrypted
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  company_id,
  decrypt_token(access_token) as access_token,
  decrypt_token(refresh_token) as refresh_token,
  is_active,
  is_encrypted,
  token_expires_at,
  created_at,
  updated_at
FROM public.quickbooks_connections;

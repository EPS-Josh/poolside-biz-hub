-- Fix views to use SECURITY INVOKER and rely on RLS from base tables
-- Drop and recreate views with SECURITY INVOKER

DROP VIEW IF EXISTS public.quickbooks_connections_decrypted;
DROP VIEW IF EXISTS public.calendar_integrations_decrypted;

-- Recreate views with SECURITY INVOKER (default, but explicit for clarity)
CREATE VIEW public.quickbooks_connections_decrypted 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  company_id,
  CASE WHEN is_encrypted THEN decrypt_token(access_token) ELSE access_token END as access_token,
  CASE WHEN is_encrypted THEN decrypt_token(refresh_token) ELSE refresh_token END as refresh_token,
  token_expires_at,
  is_active,
  created_at,
  updated_at,
  is_encrypted
FROM public.quickbooks_connections;

CREATE VIEW public.calendar_integrations_decrypted 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  provider,
  CASE WHEN is_encrypted THEN decrypt_token(access_token) ELSE access_token END as access_token,
  CASE WHEN is_encrypted THEN decrypt_token(refresh_token) ELSE refresh_token END as refresh_token,
  calendar_id,
  created_at,
  last_sync_at,
  is_active,
  token_expires_at,
  updated_at,
  is_encrypted
FROM public.calendar_integrations;

-- Grant access to authenticated users
GRANT SELECT ON public.quickbooks_connections_decrypted TO authenticated;
GRANT SELECT ON public.calendar_integrations_decrypted TO authenticated;
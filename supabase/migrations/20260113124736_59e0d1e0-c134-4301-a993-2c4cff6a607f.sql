-- Fix overly permissive RLS policy on rate_limit_log table
-- The current policy allows all authenticated users to manipulate rate limit data

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System manages rate limits" ON public.rate_limit_log;

-- Create restrictive default policy that blocks all access from regular users
-- Service role (used by edge functions) will bypass RLS automatically
CREATE POLICY "Block all client access to rate limits"
ON public.rate_limit_log
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Allow admins to view rate limit logs for debugging and monitoring
CREATE POLICY "Admins can view rate limit logs"
ON public.rate_limit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
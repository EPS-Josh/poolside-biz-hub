-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "System manages rate limits" ON rate_limit_log;

-- Create a restrictive policy that only allows service role operations
-- The service role key bypasses RLS, so this effectively blocks all client-side access
-- while still allowing edge functions using service role to manage rate limits
CREATE POLICY "Only service role can manage rate limits" ON rate_limit_log
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Add a comment explaining the security decision
COMMENT ON TABLE rate_limit_log IS 'Rate limiting data - access restricted to service role only (bypasses RLS) for security. Client-side access is blocked to prevent IP harvesting and rate limit manipulation.';
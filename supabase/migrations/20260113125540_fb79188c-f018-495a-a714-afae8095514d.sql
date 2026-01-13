-- Fix: Add RLS policies to the decrypted views
-- These views expose sensitive tokens and need proper protection

-- For quickbooks_connections_decrypted view - only allow users to see their own tokens
CREATE POLICY "Users can view their own quickbooks tokens"
ON public.quickbooks_connections
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- For calendar_integrations_decrypted view - only allow users to see their own tokens  
CREATE POLICY "Users can view their own calendar integration tokens"
ON public.calendar_integrations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Note: The decrypted views inherit RLS from their base tables
-- These policies ensure users can only access their own integration tokens
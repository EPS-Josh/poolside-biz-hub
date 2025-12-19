-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own QuickBooks connections" ON public.quickbooks_connections;

-- Create new admin-only policies
CREATE POLICY "Only admins can view QuickBooks connections"
ON public.quickbooks_connections
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can create QuickBooks connections"
ON public.quickbooks_connections
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update QuickBooks connections"
ON public.quickbooks_connections
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete QuickBooks connections"
ON public.quickbooks_connections
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
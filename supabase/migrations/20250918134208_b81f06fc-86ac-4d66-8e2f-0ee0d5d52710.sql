-- Fix RLS policy performance issues for remaining tables (Part 6 - Final)
-- Replace auth.uid() calls with (SELECT auth.uid()) to prevent re-evaluation per row

-- Fix quickbooks_connections table policies
DROP POLICY IF EXISTS "Users can view their own QuickBooks connections" ON public.quickbooks_connections;
DROP POLICY IF EXISTS "Users can create their own QuickBooks connections" ON public.quickbooks_connections;
DROP POLICY IF EXISTS "Users can update their own QuickBooks connections" ON public.quickbooks_connections;
DROP POLICY IF EXISTS "Users can delete their own QuickBooks connections" ON public.quickbooks_connections;

CREATE POLICY "Users can manage their own QuickBooks connections" 
ON public.quickbooks_connections 
FOR ALL 
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Fix saved_service_routes table policies
DROP POLICY IF EXISTS "Users can create their own saved routes" ON public.saved_service_routes;
DROP POLICY IF EXISTS "Users can view their own saved routes" ON public.saved_service_routes;
DROP POLICY IF EXISTS "Users can update their own saved routes" ON public.saved_service_routes;
DROP POLICY IF EXISTS "Users can delete their own saved routes" ON public.saved_service_routes;

CREATE POLICY "Users can manage their own saved routes" 
ON public.saved_service_routes 
FOR ALL 
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Fix audit_logs table policies
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Fix customer_scanned_documents table policies
DROP POLICY IF EXISTS "Authenticated users can view all customer scanned documents" ON public.customer_scanned_documents;
DROP POLICY IF EXISTS "Authenticated users can create customer scanned documents" ON public.customer_scanned_documents;
DROP POLICY IF EXISTS "Authenticated users can update all customer scanned documents" ON public.customer_scanned_documents;
DROP POLICY IF EXISTS "Authenticated users can delete all customer scanned documents" ON public.customer_scanned_documents;

CREATE POLICY "Authenticated users can manage customer scanned documents" 
ON public.customer_scanned_documents 
FOR ALL 
USING (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)))
WITH CHECK (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));
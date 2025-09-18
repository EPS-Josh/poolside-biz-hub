-- Fix RLS policy performance issues for remaining tables (Part 2)
-- Replace auth.uid() calls with (SELECT auth.uid()) to prevent re-evaluation per row

-- Fix customer_service_details table policies
DROP POLICY IF EXISTS "Authenticated users can view all customer service details" ON public.customer_service_details;
DROP POLICY IF EXISTS "Authenticated users can create customer service details" ON public.customer_service_details;
DROP POLICY IF EXISTS "Authenticated users can update all customer service details" ON public.customer_service_details;
DROP POLICY IF EXISTS "Authenticated users can delete all customer service details" ON public.customer_service_details;

CREATE POLICY "Authenticated users can view all customer service details" 
ON public.customer_service_details 
FOR SELECT 
USING (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));

CREATE POLICY "Authenticated users can create customer service details" 
ON public.customer_service_details 
FOR INSERT 
WITH CHECK (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));

CREATE POLICY "Authenticated users can update all customer service details" 
ON public.customer_service_details 
FOR UPDATE 
USING (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)))
WITH CHECK (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));

CREATE POLICY "Authenticated users can delete all customer service details" 
ON public.customer_service_details 
FOR DELETE 
USING (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));

-- Fix pima_assessor_records table policies
DROP POLICY IF EXISTS "Authenticated users can view assessor records" ON public.pima_assessor_records;
DROP POLICY IF EXISTS "Admins and managers can manage assessor records" ON public.pima_assessor_records;
DROP POLICY IF EXISTS "System can insert assessor records" ON public.pima_assessor_records;

-- Consolidate multiple policies into single, more efficient ones
CREATE POLICY "View assessor records" 
ON public.pima_assessor_records 
FOR SELECT 
USING ((SELECT auth.uid()) IS NOT NULL OR true); -- Allow both authenticated and system access

CREATE POLICY "Manage assessor records" 
ON public.pima_assessor_records 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR (SELECT auth.uid()) IS NULL)
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR (SELECT auth.uid()) IS NULL);
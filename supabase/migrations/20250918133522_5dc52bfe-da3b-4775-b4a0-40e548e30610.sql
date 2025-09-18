-- Fix RLS policy performance issues for remaining tables (Part 1)
-- Replace auth.uid() calls with (SELECT auth.uid()) to prevent re-evaluation per row

-- Fix service_requests table policies
DROP POLICY IF EXISTS "Admins and managers can update service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Authenticated users can create service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins and managers can view service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Authenticated users can view all service requests" ON public.service_requests;

CREATE POLICY "Admins and managers can update service requests" 
ON public.service_requests 
FOR UPDATE 
USING (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role));

CREATE POLICY "Authenticated users can create service requests" 
ON public.service_requests 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Consolidate the multiple SELECT policies for service_requests
CREATE POLICY "Service requests can be viewed by authenticated users" 
ON public.service_requests 
FOR SELECT 
USING ((SELECT auth.uid()) IS NOT NULL);

-- Fix customer_plans_drawings table policies
DROP POLICY IF EXISTS "Authenticated users can create customer plans/drawings" ON public.customer_plans_drawings;
DROP POLICY IF EXISTS "Authenticated users can update all customer plans/drawings" ON public.customer_plans_drawings;
DROP POLICY IF EXISTS "Authenticated users can view all customer plans/drawings" ON public.customer_plans_drawings;
DROP POLICY IF EXISTS "Authenticated users can delete all customer plans/drawings" ON public.customer_plans_drawings;

CREATE POLICY "Authenticated users can create customer plans/drawings" 
ON public.customer_plans_drawings 
FOR INSERT 
WITH CHECK (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));

CREATE POLICY "Authenticated users can update all customer plans/drawings" 
ON public.customer_plans_drawings 
FOR UPDATE 
USING (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)))
WITH CHECK (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));

CREATE POLICY "Authenticated users can view all customer plans/drawings" 
ON public.customer_plans_drawings 
FOR SELECT 
USING (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));

CREATE POLICY "Authenticated users can delete all customer plans/drawings" 
ON public.customer_plans_drawings 
FOR DELETE 
USING (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));
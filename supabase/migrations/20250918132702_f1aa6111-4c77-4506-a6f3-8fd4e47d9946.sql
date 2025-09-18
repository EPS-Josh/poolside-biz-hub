-- Fix RLS policy performance issues for service_records table
-- Replace auth.uid() calls with (SELECT auth.uid()) to prevent re-evaluation per row

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view all service records" ON public.service_records;
DROP POLICY IF EXISTS "Authenticated users can create service records" ON public.service_records;
DROP POLICY IF EXISTS "Authenticated users can update all service records" ON public.service_records;
DROP POLICY IF EXISTS "Authenticated users can delete all service records" ON public.service_records;

-- Create optimized policies with cached auth function calls
CREATE POLICY "Authenticated users can view all service records" 
ON public.service_records 
FOR SELECT 
USING (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));

CREATE POLICY "Authenticated users can create service records" 
ON public.service_records 
FOR INSERT 
WITH CHECK (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));

CREATE POLICY "Authenticated users can update all service records" 
ON public.service_records 
FOR UPDATE 
USING (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)))
WITH CHECK (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));

CREATE POLICY "Authenticated users can delete all service records" 
ON public.service_records 
FOR DELETE 
USING (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));
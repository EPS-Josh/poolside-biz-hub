-- Fix RLS policy performance issues for appointments table
-- Replace auth.uid() calls with (SELECT auth.uid()) to prevent re-evaluation per row

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can update all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can delete all appointments" ON public.appointments;

-- Create optimized policies with cached auth function calls
CREATE POLICY "Authenticated users can view all appointments" 
ON public.appointments 
FOR SELECT 
USING (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));

CREATE POLICY "Authenticated users can create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));

CREATE POLICY "Authenticated users can update all appointments" 
ON public.appointments 
FOR UPDATE 
USING (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)))
WITH CHECK (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));

CREATE POLICY "Authenticated users can delete all appointments" 
ON public.appointments 
FOR DELETE 
USING (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));
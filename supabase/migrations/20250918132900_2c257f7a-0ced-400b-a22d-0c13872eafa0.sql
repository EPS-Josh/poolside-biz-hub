-- Fix RLS policy performance issues for customers table
-- Replace auth.uid() calls with (SELECT auth.uid()) to prevent re-evaluation per row

-- Drop existing policies
DROP POLICY IF EXISTS "Admins and managers can create customers" ON public.customers;
DROP POLICY IF EXISTS "Admins and managers can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can update all customers" ON public.customers;
DROP POLICY IF EXISTS "Managers can update all customers" ON public.customers;
DROP POLICY IF EXISTS "Only admins can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Technicians can update service data only" ON public.customers;
DROP POLICY IF EXISTS "Technicians can view customer service data" ON public.customers;

-- Create optimized policies with cached auth function calls
CREATE POLICY "Admins and managers can create customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role));

CREATE POLICY "Admins and managers can view all customers" 
ON public.customers 
FOR SELECT 
USING (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role));

CREATE POLICY "Admins can update all customers" 
ON public.customers 
FOR UPDATE 
USING (has_role((SELECT auth.uid()), 'admin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Managers can update all customers" 
ON public.customers 
FOR UPDATE 
USING (has_role((SELECT auth.uid()), 'manager'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'manager'::app_role));

CREATE POLICY "Only admins can delete customers" 
ON public.customers 
FOR DELETE 
USING (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Technicians can update service data only" 
ON public.customers 
FOR UPDATE 
USING (has_role((SELECT auth.uid()), 'technician'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'technician'::app_role));

CREATE POLICY "Technicians can view customer service data" 
ON public.customers 
FOR SELECT 
USING (has_role((SELECT auth.uid()), 'technician'::app_role));
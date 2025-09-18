-- Fix multiple permissive UPDATE policies on customers table
-- Consolidate admin, manager, and technician UPDATE policies into a single policy

-- Drop existing separate UPDATE policies
DROP POLICY IF EXISTS "Admins can update all customers" ON public.customers;
DROP POLICY IF EXISTS "Managers can update all customers" ON public.customers;
DROP POLICY IF EXISTS "Technicians can update service data only" ON public.customers;

-- Create consolidated UPDATE policy for all roles
CREATE POLICY "Authenticated users can update customers based on role" 
ON public.customers 
FOR UPDATE 
USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'manager'::app_role) OR 
  has_role((SELECT auth.uid()), 'technician'::app_role)
)
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'manager'::app_role) OR 
  has_role((SELECT auth.uid()), 'technician'::app_role)
);
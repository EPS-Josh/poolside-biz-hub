-- Fix multiple permissive SELECT policies on customers table
-- Consolidate admin/manager and technician SELECT policies into a single policy

-- Drop existing separate SELECT policies
DROP POLICY IF EXISTS "Admins and managers can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Technicians can view customer service data" ON public.customers;

-- Create consolidated SELECT policy for all roles
CREATE POLICY "Authenticated users can view customers based on role" 
ON public.customers 
FOR SELECT 
USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'manager'::app_role) OR 
  has_role((SELECT auth.uid()), 'technician'::app_role)
);
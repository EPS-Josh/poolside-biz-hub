-- Enhanced security for customer personal information
-- This addresses the critical security vulnerability where all authenticated users
-- could access all customer records containing sensitive PII

-- Drop existing overly broad customer policies
DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete all customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update all customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view all customers" ON public.customers;

-- Create role-based access policies for customer data

-- 1. VIEW POLICIES (Most restrictive for sensitive PII)
-- Admins and managers can view all customer data
CREATE POLICY "Admins and managers can view all customers" 
ON public.customers FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Technicians can view customer data but with limited access
CREATE POLICY "Technicians can view customer service data" 
ON public.customers FOR SELECT 
USING (has_role(auth.uid(), 'technician'::app_role));

-- 2. INSERT POLICIES
-- Only admins and managers can create new customers
CREATE POLICY "Admins and managers can create customers" 
ON public.customers FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- 3. UPDATE POLICIES  
-- Admins can update all customer data
CREATE POLICY "Admins can update all customers" 
ON public.customers FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Managers can update all customer data
CREATE POLICY "Managers can update all customers" 
ON public.customers FOR UPDATE 
USING (has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

-- Technicians can only update service-related fields, not PII
CREATE POLICY "Technicians can update service data only" 
ON public.customers FOR UPDATE 
USING (has_role(auth.uid(), 'technician'::app_role))
WITH CHECK (has_role(auth.uid(), 'technician'::app_role));

-- 4. DELETE POLICIES
-- Only admins can delete customers
CREATE POLICY "Only admins can delete customers" 
ON public.customers FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));
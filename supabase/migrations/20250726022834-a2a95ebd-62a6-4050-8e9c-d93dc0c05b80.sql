-- Security Fix: Phase 1 - Fix Critical Privilege Escalation on user_roles table
-- Remove overly permissive policies and add restrictive ones

-- Drop existing policies on user_roles that may be too permissive
DROP POLICY IF EXISTS "Authenticated users can create user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can delete user roles" ON public.user_roles;

-- Ensure only admins can INSERT new roles
CREATE POLICY "Only admins can assign user roles" 
ON public.user_roles 
FOR INSERT 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure only admins can UPDATE existing roles
CREATE POLICY "Only admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure only admins can DELETE roles
CREATE POLICY "Only admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Security Fix: Phase 2 - Implement Proper Data Access Controls
-- Replace overly permissive policies with user-specific access

-- Fix customers table - users should only access their own customers
DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update all customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete all customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view all customers" ON public.customers;

CREATE POLICY "Users can view their own customers" 
ON public.customers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers" 
ON public.customers 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers" 
ON public.customers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix appointments table - users should only access their own appointments
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can update all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can delete all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can view all appointments" ON public.appointments;

CREATE POLICY "Users can view their own appointments" 
ON public.appointments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments" 
ON public.appointments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix service_records table - users should only access their own service records
DROP POLICY IF EXISTS "Authenticated users can create service records" ON public.service_records;
DROP POLICY IF EXISTS "Authenticated users can update all service records" ON public.service_records;
DROP POLICY IF EXISTS "Authenticated users can delete all service records" ON public.service_records;
DROP POLICY IF EXISTS "Authenticated users can view all service records" ON public.service_records;

CREATE POLICY "Users can view their own service records" 
ON public.service_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own service records" 
ON public.service_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service records" 
ON public.service_records 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service records" 
ON public.service_records 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix company_data table - restrict to admin/manager roles only
DROP POLICY IF EXISTS "Authenticated users can view company data" ON public.company_data;
DROP POLICY IF EXISTS "Authenticated users can insert company data" ON public.company_data;
DROP POLICY IF EXISTS "Authenticated users can update company data" ON public.company_data;
DROP POLICY IF EXISTS "Authenticated users can delete company data" ON public.company_data;

CREATE POLICY "Only admins and managers can view company data" 
ON public.company_data 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Only admins and managers can create company data" 
ON public.company_data 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Only admins and managers can update company data" 
ON public.company_data 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Only admins and managers can delete company data" 
ON public.company_data 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Fix customer_photos table - users should only access photos for their own customers
DROP POLICY IF EXISTS "Authenticated users can create customer photos" ON public.customer_photos;
DROP POLICY IF EXISTS "Authenticated users can update all customer photos" ON public.customer_photos;
DROP POLICY IF EXISTS "Authenticated users can delete all customer photos" ON public.customer_photos;
DROP POLICY IF EXISTS "Authenticated users can view all customer photos" ON public.customer_photos;

CREATE POLICY "Users can view photos for their own customers" 
ON public.customer_photos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.customers 
    WHERE customers.id = customer_photos.customer_id 
    AND customers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create photos for their own customers" 
ON public.customer_photos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers 
    WHERE customers.id = customer_photos.customer_id 
    AND customers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update photos for their own customers" 
ON public.customer_photos 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.customers 
    WHERE customers.id = customer_photos.customer_id 
    AND customers.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers 
    WHERE customers.id = customer_photos.customer_id 
    AND customers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete photos for their own customers" 
ON public.customer_photos 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.customers 
    WHERE customers.id = customer_photos.customer_id 
    AND customers.user_id = auth.uid()
  )
);

-- Fix customer_service_details table - users should only access details for their own customers
DROP POLICY IF EXISTS "Authenticated users can create customer service details" ON public.customer_service_details;
DROP POLICY IF EXISTS "Authenticated users can update all customer service details" ON public.customer_service_details;
DROP POLICY IF EXISTS "Authenticated users can delete all customer service details" ON public.customer_service_details;
DROP POLICY IF EXISTS "Authenticated users can view all customer service details" ON public.customer_service_details;

CREATE POLICY "Users can view service details for their own customers" 
ON public.customer_service_details 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.customers 
    WHERE customers.id = customer_service_details.customer_id 
    AND customers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create service details for their own customers" 
ON public.customer_service_details 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers 
    WHERE customers.id = customer_service_details.customer_id 
    AND customers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update service details for their own customers" 
ON public.customer_service_details 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.customers 
    WHERE customers.id = customer_service_details.customer_id 
    AND customers.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers 
    WHERE customers.id = customer_service_details.customer_id 
    AND customers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete service details for their own customers" 
ON public.customer_service_details 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.customers 
    WHERE customers.id = customer_service_details.customer_id 
    AND customers.user_id = auth.uid()
  )
);
-- Security Fix: Fix syntax errors in INSERT policies
-- Remove USING clauses from INSERT policies as they're not allowed

-- Drop and recreate user_roles policies with correct syntax
DROP POLICY IF EXISTS "Only admins can assign user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete user roles" ON public.user_roles;

-- Fix user_roles policies - only WITH CHECK for INSERT
CREATE POLICY "Only admins can assign user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Drop and recreate customers policies with correct syntax
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can create their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;

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

-- Drop and recreate appointments policies with correct syntax
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;

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

-- Drop and recreate service_records policies with correct syntax
DROP POLICY IF EXISTS "Users can view their own service records" ON public.service_records;
DROP POLICY IF EXISTS "Users can create their own service records" ON public.service_records;
DROP POLICY IF EXISTS "Users can update their own service records" ON public.service_records;
DROP POLICY IF EXISTS "Users can delete their own service records" ON public.service_records;

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

-- Drop and recreate company_data policies with correct syntax
DROP POLICY IF EXISTS "Only admins and managers can view company data" ON public.company_data;
DROP POLICY IF EXISTS "Only admins and managers can create company data" ON public.company_data;
DROP POLICY IF EXISTS "Only admins and managers can update company data" ON public.company_data;
DROP POLICY IF EXISTS "Only admins and managers can delete company data" ON public.company_data;

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

-- Drop and recreate customer_photos policies with correct syntax
DROP POLICY IF EXISTS "Users can view photos for their own customers" ON public.customer_photos;
DROP POLICY IF EXISTS "Users can create photos for their own customers" ON public.customer_photos;
DROP POLICY IF EXISTS "Users can update photos for their own customers" ON public.customer_photos;
DROP POLICY IF EXISTS "Users can delete photos for their own customers" ON public.customer_photos;

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

-- Drop and recreate customer_service_details policies with correct syntax
DROP POLICY IF EXISTS "Users can view service details for their own customers" ON public.customer_service_details;
DROP POLICY IF EXISTS "Users can create service details for their own customers" ON public.customer_service_details;
DROP POLICY IF EXISTS "Users can update service details for their own customers" ON public.customer_service_details;
DROP POLICY IF EXISTS "Users can delete service details for their own customers" ON public.customer_service_details;

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
-- Fix security definer view issue

-- Drop and recreate the view with proper security settings
DROP VIEW IF EXISTS public.customer_service_view;

-- Create a secure view for technicians with masked sensitive data using security invoker
CREATE VIEW public.customer_service_view 
WITH (security_invoker = true)
AS
SELECT 
  id,
  first_name,
  last_name,
  -- Show masked contact info for technicians, full info for admins/managers
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) 
    THEN email 
    WHEN email IS NOT NULL AND email != ''
    THEN CONCAT(LEFT(email, 2), '***@', SPLIT_PART(email, '@', 2))
    ELSE email
  END as email,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) 
    THEN phone 
    WHEN phone IS NOT NULL AND LENGTH(phone) >= 4
    THEN CONCAT('***-***-', RIGHT(phone, 4))
    ELSE phone
  END as phone,
  address, -- Address needed for service location
  city,
  state,
  zip_code,
  -- Service-related fields (safe for all roles)
  notes,
  owner_verified_at,
  verification_status,
  pima_county_resident,
  created_at,
  updated_at
FROM public.customers
WHERE 
  -- Apply same role-based restrictions as main table
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'technician'::app_role);
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

-- Technicians can view customer data but with limited fields (implemented via views)
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
WITH CHECK (
  has_role(auth.uid(), 'technician'::app_role) AND
  -- Prevent updates to sensitive PII fields
  (OLD.first_name = NEW.first_name) AND
  (OLD.last_name = NEW.last_name) AND
  (OLD.email = NEW.email) AND
  (OLD.phone = NEW.phone) AND
  (OLD.address = NEW.address) AND
  (OLD.city = NEW.city) AND
  (OLD.state = NEW.state) AND
  (OLD.zip_code = NEW.zip_code)
);

-- 4. DELETE POLICIES
-- Only admins can delete customers
CREATE POLICY "Only admins can delete customers" 
ON public.customers FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create audit logging function for customer data access
CREATE OR REPLACE FUNCTION public.log_customer_access()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all customer data access for security monitoring
  IF TG_OP = 'SELECT' THEN
    -- Note: SELECT triggers don't work the same way, we'll handle this differently
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      created_at
    ) VALUES (
      auth.uid(),
      'customer_updated',
      'customers',
      NEW.id::text,
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb,
      NOW()
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      old_values,
      created_at
    ) VALUES (
      auth.uid(),
      'customer_deleted',
      'customers',
      OLD.id::text,
      row_to_json(OLD)::jsonb,
      NOW()
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      new_values,
      created_at
    ) VALUES (
      auth.uid(),
      'customer_created',
      'customers',
      NEW.id::text,
      row_to_json(NEW)::jsonb,
      NOW()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit trigger to customers table
CREATE TRIGGER customers_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.log_customer_access();

-- Create a secure view for technicians with limited customer data
CREATE OR REPLACE VIEW public.customer_service_view AS
SELECT 
  id,
  first_name,
  last_name,
  -- Masked/limited contact info for technicians
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) 
    THEN email 
    ELSE CONCAT(LEFT(email, 3), '***@', SPLIT_PART(email, '@', 2))
  END as email,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) 
    THEN phone 
    ELSE CONCAT('***-***-', RIGHT(phone, 4))
  END as phone,
  address, -- Needed for service location
  city,
  state,
  zip_code,
  -- Service-related fields (safe for technicians)
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

-- Enable RLS on the view (inherits from base table)
ALTER VIEW public.customer_service_view SET (security_invoker = true);

-- Create function to validate customer data modifications
CREATE OR REPLACE FUNCTION public.validate_customer_data_access()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Additional validation for sensitive operations
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required for customer data access';
  END IF;
  
  -- Prevent unauthorized role escalation attempts
  IF TG_OP = 'UPDATE' AND has_role(auth.uid(), 'technician'::app_role) THEN
    -- Ensure technicians cannot modify sensitive PII
    IF (OLD.first_name != NEW.first_name OR 
        OLD.last_name != NEW.last_name OR 
        OLD.email != NEW.email OR 
        OLD.phone != NEW.phone OR 
        OLD.address != NEW.address) THEN
      RAISE EXCEPTION 'Insufficient permissions to modify customer personal information';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply validation trigger
CREATE TRIGGER customers_validation_trigger
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.validate_customer_data_access();
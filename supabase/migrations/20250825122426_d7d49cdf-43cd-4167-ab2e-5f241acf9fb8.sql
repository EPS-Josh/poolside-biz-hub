-- Add audit logging and additional security features for customer data

-- Create audit logging function for customer data access
CREATE OR REPLACE FUNCTION public.log_customer_access()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all customer data modifications for security monitoring
  IF TG_OP = 'UPDATE' THEN
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

-- Create function to validate customer data modifications by technicians
CREATE OR REPLACE FUNCTION public.validate_technician_customer_updates()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Additional validation for technician modifications
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required for customer data access';
  END IF;
  
  -- If user is a technician, prevent them from modifying sensitive PII
  IF has_role(auth.uid(), 'technician'::app_role) AND NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) THEN
    -- Check if trying to modify sensitive fields
    IF (OLD.first_name IS DISTINCT FROM NEW.first_name OR 
        OLD.last_name IS DISTINCT FROM NEW.last_name OR 
        OLD.email IS DISTINCT FROM NEW.email OR 
        OLD.phone IS DISTINCT FROM NEW.phone OR 
        OLD.address IS DISTINCT FROM NEW.address OR
        OLD.city IS DISTINCT FROM NEW.city OR
        OLD.state IS DISTINCT FROM NEW.state OR
        OLD.zip_code IS DISTINCT FROM NEW.zip_code) THEN
      RAISE EXCEPTION 'Technicians cannot modify customer personal information';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply validation trigger for technician updates
CREATE TRIGGER customers_technician_validation_trigger
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.validate_technician_customer_updates();

-- Create a secure view for technicians with masked sensitive data
CREATE OR REPLACE VIEW public.customer_service_view AS
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

-- Create function to log customer data access attempts
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  accessed_table TEXT,
  customer_id UUID,
  access_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    new_values,
    created_at
  ) VALUES (
    auth.uid(),
    'sensitive_data_access',
    accessed_table,
    customer_id::text,
    jsonb_build_object(
      'access_type', access_type,
      'user_role', (
        CASE 
          WHEN has_role(auth.uid(), 'admin'::app_role) THEN 'admin'
          WHEN has_role(auth.uid(), 'manager'::app_role) THEN 'manager'
          WHEN has_role(auth.uid(), 'technician'::app_role) THEN 'technician'
          ELSE 'unknown'
        END
      ),
      'timestamp', NOW()
    ),
    NOW()
  );
END;
$$;
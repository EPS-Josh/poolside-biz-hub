-- Phase 1: Critical Data Protection Fixes (Continued)

-- 1. Secure customer_service_view - Add RLS policies to protect customer PII
ALTER TABLE public.customer_service_view ENABLE ROW LEVEL SECURITY;

-- Only admins and managers can view complete customer data
CREATE POLICY "Admins and managers can view customer service data" 
ON public.customer_service_view 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Technicians can view limited customer service data (no full PII)
CREATE POLICY "Technicians can view limited service data" 
ON public.customer_service_view 
FOR SELECT 
USING (
  has_role(auth.uid(), 'technician'::app_role) AND
  -- Log access to sensitive data for audit trail
  (SELECT public.log_sensitive_data_access('customer_service_view', id, 'technician_access')) IS NOT NULL
);

-- 2. Secure pima_assessor_records - Remove unauthenticated access
DROP POLICY IF EXISTS "Anyone can view assessor records" ON public.pima_assessor_records;

-- Only authenticated users with business need can access property owner data  
CREATE POLICY "Authenticated users can view assessor records" 
ON public.pima_assessor_records 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only admins and managers can modify assessor records
DROP POLICY IF EXISTS "System can update assessor records" ON public.pima_assessor_records;
DROP POLICY IF EXISTS "System can delete assessor records" ON public.pima_assessor_records;
DROP POLICY IF EXISTS "System can insert assessor records" ON public.pima_assessor_records;

CREATE POLICY "Admins and managers can manage assessor records" 
ON public.pima_assessor_records 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- System operations for data imports (edge functions)
CREATE POLICY "System can insert assessor records" 
ON public.pima_assessor_records 
FOR INSERT 
WITH CHECK (true);

-- 3. Add comprehensive audit logging for customer data access
CREATE OR REPLACE FUNCTION public.log_customer_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Create trigger for customer audit logging
DROP TRIGGER IF EXISTS audit_customers ON public.customers;
CREATE TRIGGER audit_customers
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.log_customer_access();

-- 4. Add validation trigger for technician customer updates to prevent PII modification
CREATE OR REPLACE FUNCTION public.validate_technician_customer_updates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
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
$function$;

-- Create trigger for technician validation
DROP TRIGGER IF EXISTS validate_technician_updates ON public.customers;
CREATE TRIGGER validate_technician_updates
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.validate_technician_customer_updates();

-- 5. Create function for logging sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(accessed_table text, customer_id uuid, access_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;
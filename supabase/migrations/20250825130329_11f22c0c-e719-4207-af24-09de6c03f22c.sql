-- Critical Security Fixes

-- 1. Fix service_requests table - remove public access and require authentication
DROP POLICY IF EXISTS "Anyone can create service requests" ON public.service_requests;

-- Create secure policy for service requests - only authenticated users can create
CREATE POLICY "Authenticated users can create service requests" 
ON public.service_requests 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins and managers can view service requests (contains PII)
CREATE POLICY "Admins and managers can view service requests" 
ON public.service_requests 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Only admins and managers can update service requests
DROP POLICY IF EXISTS "Authenticated users can update service requests" ON public.service_requests;
CREATE POLICY "Admins and managers can update service requests" 
ON public.service_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- 2. Fix company_data table - remove conflicting broad access policies
DROP POLICY IF EXISTS "Authenticated users can view company data" ON public.company_data;
DROP POLICY IF EXISTS "Authenticated users can insert company data" ON public.company_data;
DROP POLICY IF EXISTS "Authenticated users can update company data" ON public.company_data;
DROP POLICY IF EXISTS "Authenticated users can delete company data" ON public.company_data;

-- Keep only the restrictive admin/manager policies (these already exist and are correct)
-- "Only admins and managers can view company data"
-- "Only admins and managers can create company data" 
-- "Only admins and managers can update company data"
-- "Only admins and managers can delete company data"

-- 3. Add audit logging trigger for service requests access
CREATE OR REPLACE FUNCTION public.log_service_request_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log all service request modifications for security monitoring
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
      'service_request_updated',
      'service_requests',
      NEW.id::text,
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb,
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
      'service_request_created',
      'service_requests',
      NEW.id::text,
      row_to_json(NEW)::jsonb,
      NOW()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for service request audit logging
DROP TRIGGER IF EXISTS audit_service_requests ON public.service_requests;
CREATE TRIGGER audit_service_requests
  AFTER INSERT OR UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_service_request_access();

-- 4. Add validation for service request data
CREATE OR REPLACE FUNCTION public.validate_service_request_data()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate required fields
  IF NEW.first_name IS NULL OR LENGTH(TRIM(NEW.first_name)) = 0 THEN
    RAISE EXCEPTION 'First name is required';
  END IF;
  
  IF NEW.last_name IS NULL OR LENGTH(TRIM(NEW.last_name)) = 0 THEN
    RAISE EXCEPTION 'Last name is required';
  END IF;
  
  IF NEW.email IS NULL OR LENGTH(TRIM(NEW.email)) = 0 THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  
  -- Basic email validation
  IF NEW.email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Sanitize input data
  NEW.first_name = TRIM(NEW.first_name);
  NEW.last_name = TRIM(NEW.last_name);
  NEW.email = LOWER(TRIM(NEW.email));
  NEW.phone = TRIM(NEW.phone);
  NEW.address = TRIM(NEW.address);
  
  RETURN NEW;
END;
$function$;

-- Create trigger for service request validation
DROP TRIGGER IF EXISTS validate_service_requests ON public.service_requests;
CREATE TRIGGER validate_service_requests
  BEFORE INSERT OR UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_service_request_data();
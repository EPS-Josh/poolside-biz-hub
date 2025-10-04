-- Update the validation trigger to allow service role operations
DROP FUNCTION IF EXISTS public.validate_technician_customer_updates() CASCADE;

CREATE OR REPLACE FUNCTION public.validate_technician_customer_updates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow service role operations (auth.uid() will be null)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS validate_customer_updates ON public.customers;
CREATE TRIGGER validate_customer_updates
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_technician_customer_updates();
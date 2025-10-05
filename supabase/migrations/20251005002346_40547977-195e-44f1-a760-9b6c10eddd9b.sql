-- Create customer profile history table
CREATE TABLE public.customer_profile_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_source TEXT DEFAULT 'customer_portal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.customer_profile_history ENABLE ROW LEVEL SECURITY;

-- RLS policy: Authenticated users (staff) can view history
CREATE POLICY "Staff can view customer profile history"
ON public.customer_profile_history
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND NOT has_role(auth.uid(), 'guest'::app_role)
);

-- RLS policy: System can insert history records
CREATE POLICY "System can insert profile history"
ON public.customer_profile_history
FOR INSERT
WITH CHECK (true);

-- Create function to log customer profile changes
CREATE OR REPLACE FUNCTION public.log_customer_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log changes made by customers (customer_user_id is set)
  IF NEW.customer_user_id IS NOT NULL AND NEW.customer_user_id = auth.uid() THEN
    -- Log email changes
    IF OLD.email IS DISTINCT FROM NEW.email THEN
      INSERT INTO public.customer_profile_history (customer_id, changed_by, field_changed, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'email', OLD.email, NEW.email);
    END IF;
    
    -- Log phone changes
    IF OLD.phone IS DISTINCT FROM NEW.phone THEN
      INSERT INTO public.customer_profile_history (customer_id, changed_by, field_changed, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'phone', OLD.phone, NEW.phone);
    END IF;
    
    -- Log company changes
    IF OLD.company IS DISTINCT FROM NEW.company THEN
      INSERT INTO public.customer_profile_history (customer_id, changed_by, field_changed, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'company', OLD.company, NEW.company);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to log changes
CREATE TRIGGER track_customer_profile_changes
AFTER UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.log_customer_profile_changes();

-- Create index for better query performance
CREATE INDEX idx_customer_profile_history_customer_id ON public.customer_profile_history(customer_id);
CREATE INDEX idx_customer_profile_history_changed_at ON public.customer_profile_history(changed_at DESC);
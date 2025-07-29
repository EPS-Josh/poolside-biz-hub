-- Security fixes for the application

-- 1. Create audit logging table for security-sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs (for triggers)
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- 2. Create function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log role assignments and removals
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      new_values
    ) VALUES (
      auth.uid(),
      'role_assigned',
      'user_roles',
      NEW.user_id::text,
      jsonb_build_object('role', NEW.role, 'assigned_to', NEW.user_id)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      old_values
    ) VALUES (
      auth.uid(),
      'role_removed',
      'user_roles',
      OLD.user_id::text,
      jsonb_build_object('role', OLD.role, 'removed_from', OLD.user_id)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for role change logging
DROP TRIGGER IF EXISTS role_change_audit_trigger ON public.user_roles;
CREATE TRIGGER role_change_audit_trigger
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();

-- 3. Clean up conflicting RLS policies by dropping overly permissive ones
-- Keep only user-specific policies and admin policies

-- Clean up appointments policies (remove overly permissive ones)
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can delete all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can update all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can view all appointments" ON public.appointments;

-- Clean up customers policies
DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete all customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update all customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view all customers" ON public.customers;

-- Clean up customer_photos policies
DROP POLICY IF EXISTS "Authenticated users can create customer photos" ON public.customer_photos;
DROP POLICY IF EXISTS "Authenticated users can delete all customer photos" ON public.customer_photos;
DROP POLICY IF EXISTS "Authenticated users can update all customer photos" ON public.customer_photos;
DROP POLICY IF EXISTS "Authenticated users can view all customer photos" ON public.customer_photos;

-- Clean up customer_service_details policies
DROP POLICY IF EXISTS "Authenticated users can create customer service details" ON public.customer_service_details;
DROP POLICY IF EXISTS "Authenticated users can delete all customer service details" ON public.customer_service_details;
DROP POLICY IF EXISTS "Authenticated users can update all customer service details" ON public.customer_service_details;
DROP POLICY IF EXISTS "Authenticated users can view all customer service details" ON public.customer_service_details;

-- Clean up service_records policies
DROP POLICY IF EXISTS "Authenticated users can create service records" ON public.service_records;
DROP POLICY IF EXISTS "Authenticated users can delete all service records" ON public.service_records;
DROP POLICY IF EXISTS "Authenticated users can update all service records" ON public.service_records;
DROP POLICY IF EXISTS "Authenticated users can view all service records" ON public.service_records;

-- Clean up inventory_items policies (keep admin access)
DROP POLICY IF EXISTS "Authenticated users can create inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Authenticated users can delete all inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Authenticated users can update all inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Authenticated users can view all inventory items" ON public.inventory_items;

-- Add proper inventory policies for different roles
CREATE POLICY "Admins and managers can manage inventory items" ON public.inventory_items
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "Technicians can view inventory items" ON public.inventory_items
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'technician'::app_role)
  );

-- 4. Create function to validate role hierarchy for assignments
CREATE OR REPLACE FUNCTION public.validate_role_assignment(
  target_user_id uuid,
  role_to_assign app_role
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only admins can assign admin roles
  IF role_to_assign = 'admin' THEN
    RETURN has_role(auth.uid(), 'admin'::app_role);
  END IF;
  
  -- Admins and managers can assign other roles
  IF has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) THEN
    RETURN true;
  END IF;
  
  -- No one else can assign roles
  RETURN false;
END;
$$;

-- 5. Add RLS policy to validate role assignments
CREATE POLICY "Validate role assignments" ON public.user_roles
  FOR INSERT WITH CHECK (
    validate_role_assignment(user_id, role)
  );

-- 6. Create function to get current user info for audit logging
CREATE OR REPLACE FUNCTION public.get_current_user_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_context jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user_id', auth.uid(),
    'email', auth.email(),
    'roles', (
      SELECT array_agg(role)
      FROM public.user_roles 
      WHERE user_id = auth.uid()
    )
  ) INTO user_context;
  
  RETURN user_context;
END;
$$;
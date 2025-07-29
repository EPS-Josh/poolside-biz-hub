-- Fix security warnings by adding proper search_path to functions

-- Fix validate_role_assignment function
CREATE OR REPLACE FUNCTION public.validate_role_assignment(
  target_user_id uuid,
  role_to_assign app_role
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix get_current_user_context function
CREATE OR REPLACE FUNCTION public.get_current_user_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix log_role_change function
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
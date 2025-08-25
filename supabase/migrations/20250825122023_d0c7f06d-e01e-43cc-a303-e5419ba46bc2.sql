-- Fix search path security issues for token functions

-- Update log_token_access function with proper search path
CREATE OR REPLACE FUNCTION public.log_token_access()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to sensitive tokens
  IF TG_OP = 'SELECT' AND TG_TABLE_NAME IN ('calendar_integrations', 'quickbooks_connections') THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      created_at
    ) VALUES (
      auth.uid(),
      'token_access',
      TG_TABLE_NAME,
      COALESCE(NEW.id::text, OLD.id::text),
      NOW()
    );
  END IF;
  
  -- Log token modifications
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
      'token_updated',
      TG_TABLE_NAME,
      NEW.id::text,
      jsonb_build_object('updated_at', OLD.updated_at),
      jsonb_build_object('updated_at', NEW.updated_at),
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
      'token_deleted',
      TG_TABLE_NAME,
      OLD.id::text,
      jsonb_build_object('provider', OLD.provider, 'deleted_at', NOW()),
      NOW()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update cleanup_expired_tokens function with proper search path
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Disable expired calendar integrations
  UPDATE public.calendar_integrations 
  SET is_active = false 
  WHERE token_expires_at < NOW() AND is_active = true;
  
  -- Disable expired QuickBooks connections
  UPDATE public.quickbooks_connections 
  SET is_active = false 
  WHERE token_expires_at < NOW() AND is_active = true;
  
  -- Log cleanup activity
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    new_values,
    created_at
  ) VALUES (
    NULL, -- System operation
    'token_cleanup',
    'system',
    jsonb_build_object('cleaned_at', NOW()),
    NOW()
  );
END;
$$;

-- Update validate_token_ownership function with proper search path
CREATE OR REPLACE FUNCTION public.validate_token_ownership()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Ensure user can only access their own tokens
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required for token operations';
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    -- Force user_id to be the authenticated user
    NEW.user_id := auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    -- Prevent user_id changes
    IF OLD.user_id != NEW.user_id THEN
      RAISE EXCEPTION 'Cannot change token ownership';
    END IF;
    -- Ensure only owner can update
    IF OLD.user_id != auth.uid() THEN
      RAISE EXCEPTION 'Insufficient permissions to update token';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
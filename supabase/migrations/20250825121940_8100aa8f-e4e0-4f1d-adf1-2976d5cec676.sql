-- Enhanced security for third-party API tokens
-- Drop existing broad policies and create more granular ones

-- Calendar Integrations Security Enhancement
DROP POLICY IF EXISTS "Users can manage their own calendar integrations" ON public.calendar_integrations;

-- Create granular policies for calendar integrations
CREATE POLICY "Users can view their own calendar integrations" 
ON public.calendar_integrations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar integrations" 
ON public.calendar_integrations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar integrations" 
ON public.calendar_integrations FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar integrations" 
ON public.calendar_integrations FOR DELETE 
USING (auth.uid() = user_id);

-- QuickBooks Connections Security Enhancement  
DROP POLICY IF EXISTS "Users can manage their own QuickBooks connections" ON public.quickbooks_connections;

-- Create granular policies for QuickBooks connections
CREATE POLICY "Users can view their own QuickBooks connections" 
ON public.quickbooks_connections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own QuickBooks connections" 
ON public.quickbooks_connections FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own QuickBooks connections" 
ON public.quickbooks_connections FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own QuickBooks connections" 
ON public.quickbooks_connections FOR DELETE 
USING (auth.uid() = user_id);

-- Add audit logging function for sensitive token operations
CREATE OR REPLACE FUNCTION public.log_token_access()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive token tables
CREATE TRIGGER calendar_integrations_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.calendar_integrations
  FOR EACH ROW EXECUTE FUNCTION public.log_token_access();

CREATE TRIGGER quickbooks_connections_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.quickbooks_connections
  FOR EACH ROW EXECUTE FUNCTION public.log_token_access();

-- Add token expiration check function
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to validate token ownership before operations
CREATE OR REPLACE FUNCTION public.validate_token_ownership()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Apply ownership validation triggers
CREATE TRIGGER calendar_integrations_ownership_trigger
  BEFORE INSERT OR UPDATE ON public.calendar_integrations
  FOR EACH ROW EXECUTE FUNCTION public.validate_token_ownership();

CREATE TRIGGER quickbooks_connections_ownership_trigger
  BEFORE INSERT OR UPDATE ON public.quickbooks_connections  
  FOR EACH ROW EXECUTE FUNCTION public.validate_token_ownership();
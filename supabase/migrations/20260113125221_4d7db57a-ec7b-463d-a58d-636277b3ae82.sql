-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create helper functions for token encryption/decryption using Vault
-- These functions access the encryption key from Supabase Vault

-- Function to encrypt a token using the vault key
CREATE OR REPLACE FUNCTION public.encrypt_token(plain_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
  encrypted_value bytea;
BEGIN
  -- Get encryption key from Supabase Vault
  -- The secret should be named 'token_encryption_key'
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'token_encryption_key'
  LIMIT 1;
  
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in Vault. Please create a secret named "token_encryption_key" in Supabase Vault.';
  END IF;
  
  -- Encrypt the token using pgcrypto with AES
  encrypted_value := pgp_sym_encrypt(plain_token, encryption_key);
  
  -- Return as base64 encoded string for storage
  RETURN encode(encrypted_value, 'base64');
END;
$$;

-- Function to decrypt a token using the vault key
CREATE OR REPLACE FUNCTION public.decrypt_token(encrypted_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
  decrypted_value text;
BEGIN
  -- Handle NULL or empty input
  IF encrypted_token IS NULL OR encrypted_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Get encryption key from Supabase Vault
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'token_encryption_key'
  LIMIT 1;
  
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in Vault. Please create a secret named "token_encryption_key" in Supabase Vault.';
  END IF;
  
  -- Decrypt the token
  BEGIN
    decrypted_value := pgp_sym_decrypt(decode(encrypted_token, 'base64'), encryption_key);
  EXCEPTION WHEN OTHERS THEN
    -- If decryption fails, it might be an unencrypted token (during migration)
    -- Return the original value
    RETURN encrypted_token;
  END;
  
  RETURN decrypted_value;
END;
$$;

-- Add columns to track encryption status
ALTER TABLE public.quickbooks_connections 
  ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;

ALTER TABLE public.calendar_integrations 
  ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;

-- Create a view that returns decrypted tokens for authorized access
-- This view will be used by edge functions to get decrypted tokens
CREATE OR REPLACE VIEW public.quickbooks_connections_decrypted AS
SELECT 
  id,
  user_id,
  company_id,
  CASE WHEN is_encrypted THEN decrypt_token(access_token) ELSE access_token END as access_token,
  CASE WHEN is_encrypted THEN decrypt_token(refresh_token) ELSE refresh_token END as refresh_token,
  token_expires_at,
  is_active,
  created_at,
  updated_at,
  is_encrypted
FROM public.quickbooks_connections;

CREATE OR REPLACE VIEW public.calendar_integrations_decrypted AS
SELECT 
  id,
  user_id,
  provider,
  CASE WHEN is_encrypted THEN decrypt_token(access_token) ELSE access_token END as access_token,
  CASE WHEN is_encrypted THEN decrypt_token(refresh_token) ELSE refresh_token END as refresh_token,
  calendar_id,
  created_at,
  last_sync_at,
  is_active,
  token_expires_at,
  updated_at,
  is_encrypted
FROM public.calendar_integrations;

-- Apply same RLS as base tables to the views (views inherit RLS from underlying tables)
-- Grant access to authenticated users (actual access controlled by RLS on base tables)
GRANT SELECT ON public.quickbooks_connections_decrypted TO authenticated;
GRANT SELECT ON public.calendar_integrations_decrypted TO authenticated;

-- Create a function to encrypt existing tokens (run this manually after setup)
CREATE OR REPLACE FUNCTION public.encrypt_existing_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt QuickBooks tokens that aren't already encrypted
  UPDATE public.quickbooks_connections
  SET 
    access_token = encrypt_token(access_token),
    refresh_token = CASE WHEN refresh_token IS NOT NULL THEN encrypt_token(refresh_token) ELSE NULL END,
    is_encrypted = true,
    updated_at = now()
  WHERE is_encrypted = false OR is_encrypted IS NULL;
  
  -- Encrypt Calendar integration tokens that aren't already encrypted
  UPDATE public.calendar_integrations
  SET 
    access_token = encrypt_token(access_token),
    refresh_token = CASE WHEN refresh_token IS NOT NULL THEN encrypt_token(refresh_token) ELSE NULL END,
    is_encrypted = true,
    updated_at = now()
  WHERE is_encrypted = false OR is_encrypted IS NULL;
  
  RAISE NOTICE 'All existing tokens have been encrypted';
END;
$$;

-- Create a trigger to automatically encrypt new tokens on insert/update
CREATE OR REPLACE FUNCTION public.auto_encrypt_quickbooks_tokens()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only encrypt if not already encrypted
  IF NEW.is_encrypted IS NULL OR NEW.is_encrypted = false THEN
    NEW.access_token := encrypt_token(NEW.access_token);
    IF NEW.refresh_token IS NOT NULL THEN
      NEW.refresh_token := encrypt_token(NEW.refresh_token);
    END IF;
    NEW.is_encrypted := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_encrypt_calendar_tokens()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only encrypt if not already encrypted
  IF NEW.is_encrypted IS NULL OR NEW.is_encrypted = false THEN
    NEW.access_token := encrypt_token(NEW.access_token);
    IF NEW.refresh_token IS NOT NULL THEN
      NEW.refresh_token := encrypt_token(NEW.refresh_token);
    END IF;
    NEW.is_encrypted := true;
  END IF;
  RETURN NEW;
END;
$$;

-- Create the triggers
DROP TRIGGER IF EXISTS encrypt_quickbooks_tokens_trigger ON public.quickbooks_connections;
CREATE TRIGGER encrypt_quickbooks_tokens_trigger
  BEFORE INSERT OR UPDATE OF access_token, refresh_token ON public.quickbooks_connections
  FOR EACH ROW
  EXECUTE FUNCTION auto_encrypt_quickbooks_tokens();

DROP TRIGGER IF EXISTS encrypt_calendar_tokens_trigger ON public.calendar_integrations;
CREATE TRIGGER encrypt_calendar_tokens_trigger
  BEFORE INSERT OR UPDATE OF access_token, refresh_token ON public.calendar_integrations
  FOR EACH ROW
  EXECUTE FUNCTION auto_encrypt_calendar_tokens();
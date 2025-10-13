-- Fix infinite recursion in customers RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "Customers can update own contact info" ON customers;

-- Create a simpler policy without recursive subqueries
CREATE POLICY "Customers can update own contact info"
ON customers
FOR UPDATE
TO authenticated
USING (customer_user_id = auth.uid())
WITH CHECK (customer_user_id = auth.uid());

-- Create a validation function to prevent customers from modifying verification fields
CREATE OR REPLACE FUNCTION public.prevent_customer_verification_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only apply this check if the user is a customer (not admin/manager)
  IF NEW.customer_user_id = auth.uid() AND 
     NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) THEN
    
    -- Prevent changes to verification fields
    IF (OLD.owner_verified_at IS DISTINCT FROM NEW.owner_verified_at OR
        OLD.owner_verified_by IS DISTINCT FROM NEW.owner_verified_by) THEN
      RAISE EXCEPTION 'Customers cannot modify verification fields';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce verification field protection
DROP TRIGGER IF EXISTS prevent_customer_verification_changes_trigger ON customers;
CREATE TRIGGER prevent_customer_verification_changes_trigger
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_customer_verification_changes();
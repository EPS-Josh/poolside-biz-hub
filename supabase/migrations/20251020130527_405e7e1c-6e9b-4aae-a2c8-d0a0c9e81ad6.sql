-- Add index on changed_by foreign key for customer_profile_history
CREATE INDEX IF NOT EXISTS idx_customer_profile_history_changed_by 
ON public.customer_profile_history(changed_by);
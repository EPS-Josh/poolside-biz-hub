-- Add missing covering index for audit_logs foreign key
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
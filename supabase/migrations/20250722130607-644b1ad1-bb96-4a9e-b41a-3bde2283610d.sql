-- Create index on user_id foreign key in calendar_sync_log table
-- This improves query performance for foreign key lookups and joins

CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_user_id 
ON public.calendar_sync_log(user_id);
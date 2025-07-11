-- Create index for foreign key calendar_sync_log_integration_id_fkey
-- This will improve query performance when joining or filtering by integration_id

CREATE INDEX idx_calendar_sync_log_integration_id 
ON public.calendar_sync_log (integration_id);
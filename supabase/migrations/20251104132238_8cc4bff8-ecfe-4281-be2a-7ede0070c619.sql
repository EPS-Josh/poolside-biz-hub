-- Add follow-up tracking fields to service_records table
ALTER TABLE public.service_records
ADD COLUMN IF NOT EXISTS needs_follow_up boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS follow_up_notes text,
ADD COLUMN IF NOT EXISTS follow_up_date date,
ADD COLUMN IF NOT EXISTS follow_up_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS follow_up_completed_at timestamp with time zone;
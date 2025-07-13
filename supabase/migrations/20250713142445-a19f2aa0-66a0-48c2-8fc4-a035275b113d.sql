-- Add parts_used field to service_records table to store inventory items used during service
ALTER TABLE public.service_records 
ADD COLUMN parts_used JSONB;
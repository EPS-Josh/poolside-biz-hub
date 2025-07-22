-- Add invoicing_status field to service_records table
ALTER TABLE public.service_records 
ADD COLUMN invoicing_status TEXT NOT NULL DEFAULT 'ready_for_qb' 
CHECK (invoicing_status IN ('not_to_be_invoiced', 'connected_to_future_record', 'ready_for_qb'));
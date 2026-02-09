ALTER TABLE public.service_records DROP CONSTRAINT IF EXISTS service_records_invoicing_status_check;

ALTER TABLE public.service_records ADD CONSTRAINT service_records_invoicing_status_check 
CHECK (invoicing_status IN ('ready_for_qb', 'synced_to_qb', 'not_to_be_invoiced', 'connected_to_future_record', 'bill_to_company', 'special_agreement'));
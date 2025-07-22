-- Add "bill_to_company" option to invoicing_status field
ALTER TABLE public.service_records 
DROP CONSTRAINT service_records_invoicing_status_check;

ALTER TABLE public.service_records 
ADD CONSTRAINT service_records_invoicing_status_check 
CHECK (invoicing_status IN ('not_to_be_invoiced', 'connected_to_future_record', 'ready_for_qb', 'bill_to_company'));
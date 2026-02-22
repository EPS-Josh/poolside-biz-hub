-- Update service records from Paul Ellis to Jerry Ellis
UPDATE public.service_records 
SET customer_id = '90385b22-1185-4a59-ae31-149de4fbe012',
    updated_at = now()
WHERE id IN ('73a9c71e-283b-4b08-a9e3-875b65560d14', 'e5a95f5c-90b7-4973-b875-f3b921819c0d')
AND customer_id = '91c375e2-27f8-44b6-b254-1926ca731e72';
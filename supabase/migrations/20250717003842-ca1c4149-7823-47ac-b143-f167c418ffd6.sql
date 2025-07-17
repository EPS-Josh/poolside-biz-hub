-- Test the trigger manually by updating the service record to trigger inventory deduction
UPDATE service_records 
SET updated_at = NOW()
WHERE id = '3e7442f6-beb3-4590-a034-ea1b07b10dd3';
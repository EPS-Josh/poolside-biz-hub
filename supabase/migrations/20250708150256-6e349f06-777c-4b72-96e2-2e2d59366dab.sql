
-- Remove quotes from address-related fields in existing customer records
UPDATE public.customers 
SET 
  address = REPLACE(REPLACE(address, '"', ''), '''', ''),
  city = REPLACE(REPLACE(city, '"', ''), '''', ''),
  state = REPLACE(REPLACE(state, '"', ''), '''', ''),
  zip_code = REPLACE(REPLACE(zip_code, '"', ''), '''', ''),
  company = REPLACE(REPLACE(company, '"', ''), '''', ''),
  notes = REPLACE(REPLACE(notes, '"', ''), '''', '')
WHERE 
  address LIKE '%"%' OR address LIKE '%''%' OR
  city LIKE '%"%' OR city LIKE '%''%' OR
  state LIKE '%"%' OR state LIKE '%''%' OR
  zip_code LIKE '%"%' OR zip_code LIKE '%''%' OR
  company LIKE '%"%' OR company LIKE '%''%' OR
  notes LIKE '%"%' OR notes LIKE '%''%';

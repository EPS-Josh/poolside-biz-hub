
-- Clean up misplaced state and zip code data
-- First, let's handle cases where state field contains both state and zip
UPDATE public.customers 
SET 
  -- Extract just the state abbreviation (first 2 characters if it looks like "NY 10001")
  state = CASE 
    WHEN state ~ '^[A-Z]{2}\s+\d+' THEN LEFT(state, 2)
    WHEN state ~ '^\d{5}' THEN NULL  -- If state field starts with digits, it's probably a zip
    ELSE state
  END,
  
  -- Extract zip code from state field if it contains both state and zip
  zip_code = CASE
    WHEN state ~ '^[A-Z]{2}\s+(\d{5})' THEN 
      SUBSTRING(state FROM '^[A-Z]{2}\s+(\d{5})')
    WHEN zip_code ~ '^[A-Za-z\s]+$' AND notes ~ '\d{5}' THEN
      -- If zip_code has state name and notes has zip, extract zip from notes
      SUBSTRING(notes FROM '(\d{5})')
    ELSE zip_code
  END,
  
  -- Clean up notes field by removing zip codes
  notes = CASE
    WHEN notes ~ '\d{5}' THEN 
      TRIM(REGEXP_REPLACE(notes, '\d{5}(-\d{4})?', '', 'g'))
    ELSE notes
  END
WHERE 
  -- Only update rows that have data issues
  state ~ '^[A-Z]{2}\s+\d+' OR  -- State field contains state + zip
  (zip_code ~ '^[A-Za-z\s]+$' AND notes ~ '\d{5}') OR  -- Zip field has state name and notes has zip
  notes ~ '\d{5}';  -- Notes field contains zip codes

-- Second pass: Handle cases where zip_code field contains full state names
UPDATE public.customers 
SET 
  state = CASE
    WHEN zip_code ~ '^(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)' THEN
      CASE 
        WHEN zip_code ILIKE 'Alabama%' THEN 'AL'
        WHEN zip_code ILIKE 'Alaska%' THEN 'AK'
        WHEN zip_code ILIKE 'Arizona%' THEN 'AZ'
        WHEN zip_code ILIKE 'Arkansas%' THEN 'AR'
        WHEN zip_code ILIKE 'California%' THEN 'CA'
        WHEN zip_code ILIKE 'Colorado%' THEN 'CO'
        WHEN zip_code ILIKE 'Connecticut%' THEN 'CT'
        WHEN zip_code ILIKE 'Delaware%' THEN 'DE'
        WHEN zip_code ILIKE 'Florida%' THEN 'FL'
        WHEN zip_code ILIKE 'Georgia%' THEN 'GA'
        WHEN zip_code ILIKE 'Hawaii%' THEN 'HI'
        WHEN zip_code ILIKE 'Idaho%' THEN 'ID'
        WHEN zip_code ILIKE 'Illinois%' THEN 'IL'
        WHEN zip_code ILIKE 'Indiana%' THEN 'IN'
        WHEN zip_code ILIKE 'Iowa%' THEN 'IA'
        WHEN zip_code ILIKE 'Kansas%' THEN 'KS'
        WHEN zip_code ILIKE 'Kentucky%' THEN 'KY'
        WHEN zip_code ILIKE 'Louisiana%' THEN 'LA'
        WHEN zip_code ILIKE 'Maine%' THEN 'ME'
        WHEN zip_code ILIKE 'Maryland%' THEN 'MD'
        WHEN zip_code ILIKE 'Massachusetts%' THEN 'MA'
        WHEN zip_code ILIKE 'Michigan%' THEN 'MI'
        WHEN zip_code ILIKE 'Minnesota%' THEN 'MN'
        WHEN zip_code ILIKE 'Mississippi%' THEN 'MS'
        WHEN zip_code ILIKE 'Missouri%' THEN 'MO'
        WHEN zip_code ILIKE 'Montana%' THEN 'MT'
        WHEN zip_code ILIKE 'Nebraska%' THEN 'NE'
        WHEN zip_code ILIKE 'Nevada%' THEN 'NV'
        WHEN zip_code ILIKE 'New Hampshire%' THEN 'NH'
        WHEN zip_code ILIKE 'New Jersey%' THEN 'NJ'
        WHEN zip_code ILIKE 'New Mexico%' THEN 'NM'
        WHEN zip_code ILIKE 'New York%' THEN 'NY'
        WHEN zip_code ILIKE 'North Carolina%' THEN 'NC'
        WHEN zip_code ILIKE 'North Dakota%' THEN 'ND'
        WHEN zip_code ILIKE 'Ohio%' THEN 'OH'
        WHEN zip_code ILIKE 'Oklahoma%' THEN 'OK'
        WHEN zip_code ILIKE 'Oregon%' THEN 'OR'
        WHEN zip_code ILIKE 'Pennsylvania%' THEN 'PA'
        WHEN zip_code ILIKE 'Rhode Island%' THEN 'RI'
        WHEN zip_code ILIKE 'South Carolina%' THEN 'SC'
        WHEN zip_code ILIKE 'South Dakota%' THEN 'SD'
        WHEN zip_code ILIKE 'Tennessee%' THEN 'TN'
        WHEN zip_code ILIKE 'Texas%' THEN 'TX'
        WHEN zip_code ILIKE 'Utah%' THEN 'UT'
        WHEN zip_code ILIKE 'Vermont%' THEN 'VT'
        WHEN zip_code ILIKE 'Virginia%' THEN 'VA'
        WHEN zip_code ILIKE 'Washington%' THEN 'WA'
        WHEN zip_code ILIKE 'West Virginia%' THEN 'WV'
        WHEN zip_code ILIKE 'Wisconsin%' THEN 'WI'
        WHEN zip_code ILIKE 'Wyoming%' THEN 'WY'
        ELSE state
      END
    ELSE state
  END,
  
  zip_code = CASE
    WHEN notes ~ '\d{5}(-\d{4})?' THEN
      SUBSTRING(notes FROM '(\d{5}(-\d{4})?)')
    ELSE NULL
  END
WHERE 
  zip_code ~ '^(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)' AND
  notes ~ '\d{5}';

-- Final cleanup: Remove any remaining zip codes from notes field and clean up empty notes
UPDATE public.customers 
SET 
  notes = CASE
    WHEN TRIM(REGEXP_REPLACE(notes, '\d{5}(-\d{4})?', '', 'g')) = '' THEN NULL
    ELSE TRIM(REGEXP_REPLACE(notes, '\d{5}(-\d{4})?', '', 'g'))
  END
WHERE 
  notes ~ '\d{5}';

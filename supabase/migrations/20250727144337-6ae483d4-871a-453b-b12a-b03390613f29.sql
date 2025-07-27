-- Add missing columns to match Pima County CSV structure
ALTER TABLE public.pima_assessor_records 
ADD COLUMN IF NOT EXISTS parcel text,
ADD COLUMN IF NOT EXISTS mail1 text,
ADD COLUMN IF NOT EXISTS mail2 text,
ADD COLUMN IF NOT EXISTS mail3 text,
ADD COLUMN IF NOT EXISTS mail4 text,
ADD COLUMN IF NOT EXISTS mail5 text,
ADD COLUMN IF NOT EXISTS zip text,
ADD COLUMN IF NOT EXISTS zip4 text;

-- Update parcel_number to use the parcel column if it's empty
UPDATE public.pima_assessor_records 
SET parcel_number = parcel 
WHERE parcel_number IS NULL AND parcel IS NOT NULL;

-- Create a combined mailing address from mail1-mail5 if mailing_address is empty
UPDATE public.pima_assessor_records 
SET mailing_address = TRIM(CONCAT_WS(' ', mail1, mail2, mail3, mail4, mail5))
WHERE mailing_address IS NULL AND (mail1 IS NOT NULL OR mail2 IS NOT NULL OR mail3 IS NOT NULL OR mail4 IS NOT NULL OR mail5 IS NOT NULL);
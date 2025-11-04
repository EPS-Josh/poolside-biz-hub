-- One-time data update: Set follow-up flags for existing service records with technician notes
UPDATE public.service_records
SET 
  needs_follow_up = true,
  follow_up_notes = technician_notes
WHERE 
  technician_notes IS NOT NULL 
  AND technician_notes != ''
  AND (needs_follow_up IS NULL OR needs_follow_up = false);
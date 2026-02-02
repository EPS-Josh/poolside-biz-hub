-- Drop the existing check constraint and recreate with 'unscheduled' included
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'unscheduled'));
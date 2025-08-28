-- Add recurring appointment support
ALTER TABLE public.appointments 
ADD COLUMN is_recurring BOOLEAN DEFAULT false,
ADD COLUMN recurring_frequency TEXT, -- 'daily', 'weekly', 'monthly'
ADD COLUMN recurring_end_date DATE,
ADD COLUMN recurring_parent_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
ADD COLUMN occurrence_number INTEGER DEFAULT 1;
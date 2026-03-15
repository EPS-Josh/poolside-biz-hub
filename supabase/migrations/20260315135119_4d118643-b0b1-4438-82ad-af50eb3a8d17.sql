
-- Manufacturer code lookup table
CREATE TABLE public.fps_manufacturer_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_name text NOT NULL UNIQUE,
  code char(3) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

-- Solution code lookup table
CREATE TABLE public.fps_solution_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_name text NOT NULL UNIQUE,
  code char(3) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.fps_manufacturer_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fps_solution_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for manufacturer codes
CREATE POLICY "Admins and managers can manage manufacturer codes"
  ON public.fps_manufacturer_codes FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Authenticated users can view manufacturer codes"
  ON public.fps_manufacturer_codes FOR SELECT
  TO public
  USING (auth.uid() IS NOT NULL);

-- RLS policies for solution codes
CREATE POLICY "Admins and managers can manage solution codes"
  ON public.fps_solution_codes FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Authenticated users can view solution codes"
  ON public.fps_solution_codes FOR SELECT
  TO public
  USING (auth.uid() IS NOT NULL);

-- Seed common manufacturer codes (auto-generated from first 3 letters)
INSERT INTO public.fps_manufacturer_codes (manufacturer_name, code, user_id)
VALUES 
  ('Pentair', 'PEN', '00000000-0000-0000-0000-000000000000'),
  ('Jandy', 'JAN', '00000000-0000-0000-0000-000000000000'),
  ('Hayward', 'HAY', '00000000-0000-0000-0000-000000000000'),
  ('Zodiac', 'ZOD', '00000000-0000-0000-0000-000000000000'),
  ('Polaris', 'POL', '00000000-0000-0000-0000-000000000000'),
  ('Raypak', 'RAY', '00000000-0000-0000-0000-000000000000'),
  ('Sta-Rite', 'STA', '00000000-0000-0000-0000-000000000000'),
  ('Waterway', 'WAT', '00000000-0000-0000-0000-000000000000'),
  ('Fluidra', 'FLU', '00000000-0000-0000-0000-000000000000'),
  ('AquaCal', 'AQU', '00000000-0000-0000-0000-000000000000');

-- Seed common solution codes
INSERT INTO public.fps_solution_codes (solution_name, code, user_id)
VALUES 
  ('Filters', 'FIL', '00000000-0000-0000-0000-000000000000'),
  ('Pumps', 'PMP', '00000000-0000-0000-0000-000000000000'),
  ('Heaters', 'HTR', '00000000-0000-0000-0000-000000000000'),
  ('Valves', 'VLV', '00000000-0000-0000-0000-000000000000'),
  ('Cleaners', 'CLN', '00000000-0000-0000-0000-000000000000'),
  ('Chemicals', 'CHM', '00000000-0000-0000-0000-000000000000'),
  ('Lighting', 'LGT', '00000000-0000-0000-0000-000000000000'),
  ('Controls', 'CTL', '00000000-0000-0000-0000-000000000000'),
  ('Plumbing', 'PLM', '00000000-0000-0000-0000-000000000000'),
  ('Accessories', 'ACC', '00000000-0000-0000-0000-000000000000');

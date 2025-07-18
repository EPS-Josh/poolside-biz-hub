-- Create TSB Categories enum
CREATE TYPE public.tsb_category AS ENUM (
  'Pump Systems',
  'Filtration Systems', 
  'Heating Systems',
  'Sanitization & Chemical Systems',
  'Control Systems & Automation',
  'Water Features & Accessories',
  'Spa/Hot Tub Specific',
  'Safety Equipment',
  'Electrical Components',
  'Plumbing & Hydraulics'
);

-- Create TSB Priority enum
CREATE TYPE public.tsb_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- Create TSBs table
CREATE TABLE public.tsbs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category public.tsb_category NOT NULL,
  priority public.tsb_priority NOT NULL DEFAULT 'Medium',
  equipment_models TEXT[], -- Array of equipment models this applies to
  manufacturer TEXT,
  issue_description TEXT,
  solution_steps TEXT,
  parts_required JSONB, -- JSON array of parts needed
  tools_required TEXT[],
  estimated_time_minutes INTEGER,
  safety_notes TEXT,
  troubleshooting_steps TEXT,
  symptoms TEXT[],
  root_cause TEXT,
  prevention_tips TEXT,
  related_tsb_ids UUID[],
  attachments JSONB, -- JSON array of file references
  tags TEXT[],
  revision_number INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tsbs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view all TSBs"
ON public.tsbs
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create TSBs"
ON public.tsbs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can update TSBs"
ON public.tsbs
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete TSBs"
ON public.tsbs
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_tsbs_updated_at
BEFORE UPDATE ON public.tsbs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample TSBs with real swimming pool and spa repair scenarios
INSERT INTO public.tsbs (user_id, title, description, category, priority, equipment_models, manufacturer, issue_description, solution_steps, symptoms, root_cause) VALUES
(
  '8d336e89-2638-4474-8d2a-c7b20507d227',
  'Pool Pump Motor Overheating',
  'Motor running hot and shutting down intermittently',
  'Pump Systems',
  'High',
  ARRAY['WhisperFlo', 'IntelliFlo', 'SuperFlo'],
  'Pentair',
  'Pump motor overheating and tripping thermal protection',
  E'1. Check for proper ventilation around motor\n2. Inspect impeller for debris\n3. Verify correct electrical voltage\n4. Check motor capacitor\n5. Clean motor cooling fins',
  ARRAY['Motor feels very hot', 'Pump stops running', 'Tripping breaker', 'Reduced water flow'],
  'Blocked ventilation, debris in impeller, or failing capacitor'
),
(
  '8d336e89-2638-4474-8d2a-c7b20507d227',
  'Salt Chlorinator Low Output',
  'Chlorine generation below expected levels',
  'Sanitization & Chemical Systems',
  'Medium',
  ARRAY['AquaRite', 'TurboCell', 'SwimPure Plus'],
  'Hayward',
  'Salt chlorinator not producing adequate chlorine despite proper salt levels',
  E'1. Test salt level (should be 2700-3400 ppm)\n2. Inspect cell for calcium buildup\n3. Clean cell plates with muriatic acid solution\n4. Check cell voltage output\n5. Verify water temperature (above 60°F)',
  ARRAY['Low chlorine readings', 'Cell indicator light red', 'Scale buildup on cell', 'Poor water quality'],
  'Calcium scale buildup on electrolytic cell plates reducing efficiency'
),
(
  '8d336e89-2638-4474-8d2a-c7b20507d227',
  'Spa Heater Not Igniting',
  'Gas heater failing to light or maintain flame',
  'Heating Systems',
  'High',
  ARRAY['MasterTemp', 'Max-E-Therm', 'EcoStar'],
  'Pentair',
  'Gas spa heater clicking but not lighting, or lighting then shutting off',
  E'1. Check gas supply and pressure\n2. Inspect ignition electrode gap (1/8 inch)\n3. Clean heat exchanger tubes\n4. Test flame sensor\n5. Verify proper venting\n6. Check for spider webs in burner',
  ARRAY['No heat', 'Clicking sound', 'Error codes', 'Flame goes out quickly'],
  'Dirty flame sensor, improper gas pressure, or blocked burner orifices'
),
(
  '8d336e89-2638-4474-8d2a-c7b20507d227',
  'Control System Display Error',
  'Spa control panel showing error messages or blank screen',
  'Control Systems & Automation',
  'Medium',
  ARRAY['BP2100', 'IN.YE-5', 'GL2000'],
  'Balboa',
  'Spa control system display showing error codes or completely blank',
  E'1. Check all cable connections\n2. Test GFCI breaker\n3. Verify 12V power to control\n4. Inspect for water damage\n5. Reset system by power cycling\n6. Check temperature sensors',
  ARRAY['Blank display', 'Error codes', 'No response to buttons', 'Intermittent operation'],
  'Loose connections, power supply issues, or moisture intrusion'
),
(
  '8d336e89-2638-4474-8d2a-c7b20507d227',
  'Pool Filter Pressure Rising Rapidly',
  'Filter pressure gauge climbing quickly after cleaning',
  'Filtration Systems',
  'Medium',
  ARRAY['Clean & Clear', 'FNS Plus', 'System 3'],
  'Pentair',
  'Pool filter pressure increases rapidly even after backwashing or cleaning',
  E'1. Inspect filter media for damage\n2. Check for algae growth\n3. Test water chemistry\n4. Examine multiport valve operation\n5. Look for channeling in sand filters\n6. Consider filter media replacement',
  ARRAY['High pressure reading', 'Reduced flow rate', 'Dirty water return', 'Frequent backwashing needed'],
  'Worn filter media, algae growth, or improper water chemistry'
),
(
  '8d336e89-2638-4474-8d2a-c7b20507d227',
  'Variable Speed Pump Communication Error',
  'IntelliFlow pump showing communication faults',
  'Pump Systems',
  'High',
  ARRAY['IntelliFlo VSF', 'IntelliFlo VF', 'IntelliPro VSF'],
  'Pentair',
  'Variable speed pump losing communication with control system',
  E'1. Check RS485 communication wiring\n2. Verify proper termination resistors\n3. Test for electrical interference\n4. Update pump firmware\n5. Check ground connections\n6. Inspect control panel settings',
  ARRAY['Communication error messages', 'Pump not responding to commands', 'Intermittent operation', 'Speed not changing'],
  'Damaged communication wiring, electrical interference, or firmware issues'
);

-- Insert sample TSBs for spa-specific issues
INSERT INTO public.tsbs (user_id, title, description, category, priority, equipment_models, manufacturer, issue_description, solution_steps, symptoms, root_cause) VALUES
(
  '8d336e89-2638-4474-8d2a-c7b20507d227',
  'Spa Jets Not Working Properly',
  'Air jets or water jets providing weak flow or no flow',
  'Spa/Hot Tub Specific',
  'Medium',
  ARRAY['J-300', 'J-400', 'Hot Spring Series'],
  'Jacuzzi',
  'Spa jets producing weak flow, air bubbles, or no flow at all',
  E'1. Check jet air controls are open\n2. Inspect for debris in jet fittings\n3. Verify pump is priming properly\n4. Check for air leaks in plumbing\n5. Clean jet internals\n6. Test blower operation',
  ARRAY['Weak jet pressure', 'No air bubbles', 'Gurgling sounds', 'Some jets not working'],
  'Clogged jet orifices, air leaks, or blower motor failure'
),
(
  '8d336e89-2638-4474-8d2a-c7b20507d227',
  'GFCI Breaker Tripping',
  'Ground fault circuit interrupter repeatedly tripping',
  'Electrical Components',
  'Critical',
  ARRAY['Universal'],
  'Various',
  'GFCI breaker trips immediately when spa is turned on or during operation',
  E'1. Disconnect all spa components\n2. Test each component individually\n3. Check for moisture in electrical connections\n4. Inspect heating element for ground fault\n5. Test pump motor windings\n6. Examine control system for water damage',
  ARRAY['GFCI trips immediately', 'No power to spa', 'Electrical burning smell', 'Moisture in electrical box'],
  'Ground fault in heating element, pump motor, or moisture in electrical connections'
),
(
  '8d336e89-2638-4474-8d2a-c7b20507d227',
  'Pool Cleaner Not Moving',
  'Automatic pool cleaner stuck or moving erratically',
  'Water Features & Accessories',
  'Low',
  ARRAY['Polaris 280', 'Polaris 380', 'Kreepy Krauly'],
  'Polaris',
  'Automatic pool cleaner not moving around pool or getting stuck in corners',
  E'1. Check booster pump operation\n2. Inspect cleaner wheels and tracks\n3. Verify proper water flow\n4. Examine hose for kinks or leaks\n5. Clean debris from cleaner body\n6. Adjust pool return fittings',
  ARRAY['Cleaner not moving', 'Stuck in one area', 'Poor cleaning pattern', 'Hose floating'],
  'Insufficient water pressure, debris blockage, or worn drive components'
);
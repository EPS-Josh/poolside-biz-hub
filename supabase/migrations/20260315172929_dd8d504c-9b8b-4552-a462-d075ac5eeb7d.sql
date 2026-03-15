
-- Storage locations with self-referencing hierarchy
CREATE TABLE public.storage_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  location_type text NOT NULL DEFAULT 'area',
  parent_id uuid REFERENCES public.storage_locations(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Item-location junction with quantity tracking
CREATE TABLE public.inventory_item_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  storage_location_id uuid NOT NULL REFERENCES public.storage_locations(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  notes text,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(inventory_item_id, storage_location_id)
);

-- Enable RLS
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_item_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for storage_locations
CREATE POLICY "Admins and managers can manage storage locations"
  ON public.storage_locations FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Staff can view storage locations"
  ON public.storage_locations FOR SELECT TO public
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'technician'::app_role));

-- RLS policies for inventory_item_locations
CREATE POLICY "Admins and managers can manage item locations"
  ON public.inventory_item_locations FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Staff can view item locations"
  ON public.inventory_item_locations FOR SELECT TO public
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'technician'::app_role));

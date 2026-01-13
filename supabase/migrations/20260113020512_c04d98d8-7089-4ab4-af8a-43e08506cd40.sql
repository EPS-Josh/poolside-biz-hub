-- Create daily_routes table for managing technician routes
CREATE TABLE public.daily_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_date DATE NOT NULL,
  technician_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed')),
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  total_estimated_distance_miles DECIMAL(10, 2),
  total_estimated_duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(route_date, technician_user_id)
);

-- Create route_stops table for individual stops in a route
CREATE TABLE public.route_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES public.daily_routes(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  estimated_arrival_time TIME,
  estimated_duration_minutes INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'en_route', 'arrived', 'completed', 'skipped')),
  actual_arrival_time TIMESTAMP WITH TIME ZONE,
  actual_departure_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(route_id, stop_order)
);

-- Create route_change_requests table for technician suggestions
CREATE TABLE public.route_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES public.daily_routes(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('reorder', 'add_stop', 'remove_stop', 'reschedule')),
  request_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_change_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_routes
CREATE POLICY "Admins and managers can view all routes"
ON public.daily_routes FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Technicians can view their own routes"
ON public.daily_routes FOR SELECT
USING (technician_user_id = auth.uid());

CREATE POLICY "Admins and managers can create routes"
ON public.daily_routes FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Technicians can create their own routes"
ON public.daily_routes FOR INSERT
WITH CHECK (technician_user_id = auth.uid());

CREATE POLICY "Admins and managers can update any route"
ON public.daily_routes FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Technicians can update their own routes"
ON public.daily_routes FOR UPDATE
USING (technician_user_id = auth.uid());

CREATE POLICY "Admins and managers can delete routes"
ON public.daily_routes FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'manager'::app_role)
);

-- RLS Policies for route_stops
CREATE POLICY "Users can view route stops for routes they can see"
ON public.route_stops FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.daily_routes dr 
    WHERE dr.id = route_id 
    AND (
      dr.technician_user_id = auth.uid() OR
      public.has_role(auth.uid(), 'admin'::app_role) OR 
      public.has_role(auth.uid(), 'manager'::app_role)
    )
  )
);

CREATE POLICY "Users can insert stops for routes they can manage"
ON public.route_stops FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.daily_routes dr 
    WHERE dr.id = route_id 
    AND (
      dr.technician_user_id = auth.uid() OR
      public.has_role(auth.uid(), 'admin'::app_role) OR 
      public.has_role(auth.uid(), 'manager'::app_role)
    )
  )
);

CREATE POLICY "Users can update stops for routes they can manage"
ON public.route_stops FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.daily_routes dr 
    WHERE dr.id = route_id 
    AND (
      dr.technician_user_id = auth.uid() OR
      public.has_role(auth.uid(), 'admin'::app_role) OR 
      public.has_role(auth.uid(), 'manager'::app_role)
    )
  )
);

CREATE POLICY "Admins and managers can delete stops"
ON public.route_stops FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'manager'::app_role)
);

-- RLS Policies for route_change_requests
CREATE POLICY "Admins and managers can view all change requests"
ON public.route_change_requests FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Technicians can view their own change requests"
ON public.route_change_requests FOR SELECT
USING (requested_by = auth.uid());

CREATE POLICY "Anyone can create change requests"
ON public.route_change_requests FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can update change requests"
ON public.route_change_requests FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'manager'::app_role)
);

-- Indexes for performance
CREATE INDEX idx_daily_routes_date ON public.daily_routes(route_date);
CREATE INDEX idx_daily_routes_technician ON public.daily_routes(technician_user_id);
CREATE INDEX idx_daily_routes_status ON public.daily_routes(status);
CREATE INDEX idx_route_stops_route ON public.route_stops(route_id);
CREATE INDEX idx_route_stops_order ON public.route_stops(route_id, stop_order);
CREATE INDEX idx_route_change_requests_route ON public.route_change_requests(route_id);
CREATE INDEX idx_route_change_requests_status ON public.route_change_requests(status);

-- Trigger for updated_at
CREATE TRIGGER update_daily_routes_updated_at
BEFORE UPDATE ON public.daily_routes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_route_stops_updated_at
BEFORE UPDATE ON public.route_stops
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_route_change_requests_updated_at
BEFORE UPDATE ON public.route_change_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
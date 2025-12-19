-- Create table to track technician-customer assignments
CREATE TABLE public.technician_customer_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_user_id uuid NOT NULL,
    customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    assigned_at timestamp with time zone NOT NULL DEFAULT now(),
    assigned_by uuid,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(technician_user_id, customer_id)
);

-- Enable RLS
ALTER TABLE public.technician_customer_assignments ENABLE ROW LEVEL SECURITY;

-- Admins and managers can manage all assignments
CREATE POLICY "Admins and managers can manage assignments"
ON public.technician_customer_assignments
FOR ALL
USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
);

-- Technicians can view their own assignments
CREATE POLICY "Technicians can view their own assignments"
ON public.technician_customer_assignments
FOR SELECT
USING (technician_user_id = auth.uid());

-- Create a security definer function to check if technician is assigned to customer
CREATE OR REPLACE FUNCTION public.is_technician_assigned_to_customer(_user_id uuid, _customer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.technician_customer_assignments
        WHERE technician_user_id = _user_id
          AND customer_id = _customer_id
    )
$$;

-- Drop old permissive technician policy on customers
DROP POLICY IF EXISTS "Authenticated users can view customers based on role" ON public.customers;

-- Create new policies for customers table
-- Admins and managers can view all customers
CREATE POLICY "Admins and managers can view all customers"
ON public.customers
FOR SELECT
USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
);

-- Technicians can only view their assigned customers
CREATE POLICY "Technicians can view assigned customers"
ON public.customers
FOR SELECT
USING (
    has_role(auth.uid(), 'technician'::app_role) AND 
    is_technician_assigned_to_customer(auth.uid(), id)
);

-- Drop and recreate update policy for technicians
DROP POLICY IF EXISTS "Authenticated users can update customers based on role" ON public.customers;

-- Admins and managers can update all customers
CREATE POLICY "Admins and managers can update all customers"
ON public.customers
FOR UPDATE
USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
);

-- Technicians can only update their assigned customers (with restrictions via trigger)
CREATE POLICY "Technicians can update assigned customers"
ON public.customers
FOR UPDATE
USING (
    has_role(auth.uid(), 'technician'::app_role) AND 
    is_technician_assigned_to_customer(auth.uid(), id)
)
WITH CHECK (
    has_role(auth.uid(), 'technician'::app_role) AND 
    is_technician_assigned_to_customer(auth.uid(), id)
);

-- Add trigger for updated_at on technician_customer_assignments
CREATE TRIGGER update_technician_customer_assignments_updated_at
BEFORE UPDATE ON public.technician_customer_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_technician_customer_assignments_technician 
ON public.technician_customer_assignments(technician_user_id);

CREATE INDEX idx_technician_customer_assignments_customer 
ON public.technician_customer_assignments(customer_id);
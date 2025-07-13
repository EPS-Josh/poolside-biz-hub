-- Fix security issue: Set immutable search_path for update_inventory_items_updated_at function
CREATE OR REPLACE FUNCTION public.update_inventory_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';
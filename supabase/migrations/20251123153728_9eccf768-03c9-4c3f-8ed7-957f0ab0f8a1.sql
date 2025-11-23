-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  notes TEXT,
  last_price_update TIMESTAMP WITH TIME ZONE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supplier_prices table for historical tracking
CREATE TABLE IF NOT EXISTS public.supplier_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  price NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(supplier_id, inventory_item_id, updated_at)
);

-- Create indexes
CREATE INDEX idx_supplier_prices_supplier ON public.supplier_prices(supplier_id);
CREATE INDEX idx_supplier_prices_inventory ON public.supplier_prices(inventory_item_id);
CREATE INDEX idx_supplier_prices_updated ON public.supplier_prices(updated_at DESC);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_prices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Users can view their own suppliers"
  ON public.suppliers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own suppliers"
  ON public.suppliers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own suppliers"
  ON public.suppliers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own suppliers"
  ON public.suppliers FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for supplier_prices
CREATE POLICY "Users can view their own supplier prices"
  ON public.supplier_prices FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own supplier prices"
  ON public.supplier_prices FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own supplier prices"
  ON public.supplier_prices FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own supplier prices"
  ON public.supplier_prices FOR DELETE
  USING (user_id = auth.uid());

-- Trigger to update updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
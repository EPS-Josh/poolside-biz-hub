-- Add new item number columns for different suppliers/distributors
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS heritage_item_number text,
ADD COLUMN IF NOT EXISTS pwp_item_number text,
ADD COLUMN IF NOT EXISTS epool_item_number text,
ADD COLUMN IF NOT EXISTS horizon_item_number text,
ADD COLUMN IF NOT EXISTS pool360_item_number text;

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_inventory_heritage_item_number ON public.inventory_items(heritage_item_number);
CREATE INDEX IF NOT EXISTS idx_inventory_pwp_item_number ON public.inventory_items(pwp_item_number);
CREATE INDEX IF NOT EXISTS idx_inventory_epool_item_number ON public.inventory_items(epool_item_number);
CREATE INDEX IF NOT EXISTS idx_inventory_horizon_item_number ON public.inventory_items(horizon_item_number);
CREATE INDEX IF NOT EXISTS idx_inventory_pool360_item_number ON public.inventory_items(pool360_item_number);

COMMENT ON COLUMN public.inventory_items.heritage_item_number IS 'Heritage pool supply item number';
COMMENT ON COLUMN public.inventory_items.pwp_item_number IS 'PWP (Poolcorp) item number';
COMMENT ON COLUMN public.inventory_items.epool_item_number IS 'ePool supply item number';
COMMENT ON COLUMN public.inventory_items.horizon_item_number IS 'Horizon pool supply item number';
COMMENT ON COLUMN public.inventory_items.pool360_item_number IS 'Pool360 item number';
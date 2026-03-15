-- Trim whitespace from type values to fix duplicate dropdown entries
UPDATE public.inventory_items SET type = TRIM(type) WHERE type IS NOT NULL AND type != TRIM(type);
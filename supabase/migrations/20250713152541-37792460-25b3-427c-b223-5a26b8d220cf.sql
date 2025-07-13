-- Function to handle automatic inventory deduction when parts are used
CREATE OR REPLACE FUNCTION public.handle_inventory_deduction()
RETURNS TRIGGER AS $$
DECLARE
    part_record RECORD;
    inventory_item RECORD;
    parts_array JSONB;
BEGIN
    -- Handle INSERT operations
    IF TG_OP = 'INSERT' THEN
        IF NEW.parts_used IS NOT NULL THEN
            parts_array := NEW.parts_used;
            
            -- Loop through each part used
            FOR part_record IN 
                SELECT 
                    (value->>'inventoryItemId')::UUID as inventory_item_id,
                    (value->>'quantity')::INTEGER as quantity_used
                FROM jsonb_array_elements(parts_array) AS value
                WHERE value->>'inventoryItemId' IS NOT NULL 
                AND value->>'inventoryItemId' != ''
                AND (value->>'quantity')::INTEGER > 0
            LOOP
                -- Check if inventory item exists and has sufficient stock
                SELECT * INTO inventory_item 
                FROM inventory_items 
                WHERE id = part_record.inventory_item_id;
                
                IF FOUND THEN
                    IF inventory_item.quantity_in_stock >= part_record.quantity_used THEN
                        -- Deduct the quantity from inventory
                        UPDATE inventory_items 
                        SET 
                            quantity_in_stock = quantity_in_stock - part_record.quantity_used,
                            updated_at = NOW()
                        WHERE id = part_record.inventory_item_id;
                        
                        -- Log the deduction
                        RAISE NOTICE 'Deducted % units of item % (%) from inventory. New stock: %', 
                            part_record.quantity_used, 
                            part_record.inventory_item_id,
                            COALESCE(inventory_item.name, inventory_item.description, 'Unknown Item'),
                            inventory_item.quantity_in_stock - part_record.quantity_used;
                    ELSE
                        -- Insufficient stock - log warning but don't block the operation
                        RAISE WARNING 'Insufficient stock for item % (%): requested %, available %', 
                            part_record.inventory_item_id,
                            COALESCE(inventory_item.name, inventory_item.description, 'Unknown Item'),
                            part_record.quantity_used,
                            inventory_item.quantity_in_stock;
                    END IF;
                ELSE
                    RAISE WARNING 'Inventory item % not found', part_record.inventory_item_id;
                END IF;
            END LOOP;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        -- First, restore inventory from old parts_used (if any)
        IF OLD.parts_used IS NOT NULL THEN
            parts_array := OLD.parts_used;
            
            FOR part_record IN 
                SELECT 
                    (value->>'inventoryItemId')::UUID as inventory_item_id,
                    (value->>'quantity')::INTEGER as quantity_used
                FROM jsonb_array_elements(parts_array) AS value
                WHERE value->>'inventoryItemId' IS NOT NULL 
                AND value->>'inventoryItemId' != ''
                AND (value->>'quantity')::INTEGER > 0
            LOOP
                -- Restore the quantity to inventory
                UPDATE inventory_items 
                SET 
                    quantity_in_stock = quantity_in_stock + part_record.quantity_used,
                    updated_at = NOW()
                WHERE id = part_record.inventory_item_id;
                
                RAISE NOTICE 'Restored % units of item % to inventory', 
                    part_record.quantity_used, 
                    part_record.inventory_item_id;
            END LOOP;
        END IF;
        
        -- Then, deduct inventory for new parts_used (if any)
        IF NEW.parts_used IS NOT NULL THEN
            parts_array := NEW.parts_used;
            
            FOR part_record IN 
                SELECT 
                    (value->>'inventoryItemId')::UUID as inventory_item_id,
                    (value->>'quantity')::INTEGER as quantity_used
                FROM jsonb_array_elements(parts_array) AS value
                WHERE value->>'inventoryItemId' IS NOT NULL 
                AND value->>'inventoryItemId' != ''
                AND (value->>'quantity')::INTEGER > 0
            LOOP
                -- Check if inventory item exists and has sufficient stock
                SELECT * INTO inventory_item 
                FROM inventory_items 
                WHERE id = part_record.inventory_item_id;
                
                IF FOUND THEN
                    IF inventory_item.quantity_in_stock >= part_record.quantity_used THEN
                        -- Deduct the quantity from inventory
                        UPDATE inventory_items 
                        SET 
                            quantity_in_stock = quantity_in_stock - part_record.quantity_used,
                            updated_at = NOW()
                        WHERE id = part_record.inventory_item_id;
                        
                        RAISE NOTICE 'Deducted % units of item % from inventory', 
                            part_record.quantity_used, 
                            part_record.inventory_item_id;
                    ELSE
                        -- Insufficient stock - log warning but don't block the operation
                        RAISE WARNING 'Insufficient stock for item % (%): requested %, available %', 
                            part_record.inventory_item_id,
                            COALESCE(inventory_item.name, inventory_item.description, 'Unknown Item'),
                            part_record.quantity_used,
                            inventory_item.quantity_in_stock;
                    END IF;
                ELSE
                    RAISE WARNING 'Inventory item % not found', part_record.inventory_item_id;
                END IF;
            END LOOP;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE operations
    IF TG_OP = 'DELETE' THEN
        -- Restore inventory from deleted service record
        IF OLD.parts_used IS NOT NULL THEN
            parts_array := OLD.parts_used;
            
            FOR part_record IN 
                SELECT 
                    (value->>'inventoryItemId')::UUID as inventory_item_id,
                    (value->>'quantity')::INTEGER as quantity_used
                FROM jsonb_array_elements(parts_array) AS value
                WHERE value->>'inventoryItemId' IS NOT NULL 
                AND value->>'inventoryItemId' != ''
                AND (value->>'quantity')::INTEGER > 0
            LOOP
                -- Restore the quantity to inventory
                UPDATE inventory_items 
                SET 
                    quantity_in_stock = quantity_in_stock + part_record.quantity_used,
                    updated_at = NOW()
                WHERE id = part_record.inventory_item_id;
                
                RAISE NOTICE 'Restored % units of item % to inventory (service record deleted)', 
                    part_record.quantity_used, 
                    part_record.inventory_item_id;
            END LOOP;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic inventory deduction
DROP TRIGGER IF EXISTS trigger_inventory_deduction_insert ON service_records;
DROP TRIGGER IF EXISTS trigger_inventory_deduction_update ON service_records;
DROP TRIGGER IF EXISTS trigger_inventory_deduction_delete ON service_records;

CREATE TRIGGER trigger_inventory_deduction_insert
    AFTER INSERT ON service_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_inventory_deduction();

CREATE TRIGGER trigger_inventory_deduction_update
    AFTER UPDATE ON service_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_inventory_deduction();

CREATE TRIGGER trigger_inventory_deduction_delete
    AFTER DELETE ON service_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_inventory_deduction();
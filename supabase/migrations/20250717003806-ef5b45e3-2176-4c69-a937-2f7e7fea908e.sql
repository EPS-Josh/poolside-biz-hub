-- Create triggers for inventory deduction
CREATE TRIGGER trigger_inventory_deduction_insert
    AFTER INSERT ON public.service_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_inventory_deduction();

CREATE TRIGGER trigger_inventory_deduction_update
    AFTER UPDATE ON public.service_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_inventory_deduction();

CREATE TRIGGER trigger_inventory_deduction_delete
    AFTER DELETE ON public.service_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_inventory_deduction();
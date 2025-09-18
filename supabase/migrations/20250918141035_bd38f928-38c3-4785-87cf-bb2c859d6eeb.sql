-- Add covering indexes for foreign key columns to improve query performance

-- Appointments table foreign keys
CREATE INDEX IF NOT EXISTS idx_appointments_recurring_parent_id ON public.appointments(recurring_parent_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);

-- Calendar integrations
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_id ON public.calendar_integrations(user_id);

-- Calendar sync log
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_user_id ON public.calendar_sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_integration_id ON public.calendar_sync_log(integration_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_appointment_id ON public.calendar_sync_log(appointment_id);

-- Company data
CREATE INDEX IF NOT EXISTS idx_company_data_user_id ON public.company_data(user_id);

-- Customer photos
CREATE INDEX IF NOT EXISTS idx_customer_photos_customer_id ON public.customer_photos(customer_id);

-- Customer plans drawings
CREATE INDEX IF NOT EXISTS idx_customer_plans_drawings_customer_id ON public.customer_plans_drawings(customer_id);

-- Customer scanned documents
CREATE INDEX IF NOT EXISTS idx_customer_scanned_documents_customer_id ON public.customer_scanned_documents(customer_id);

-- Customer service details
CREATE INDEX IF NOT EXISTS idx_customer_service_details_customer_id ON public.customer_service_details(customer_id);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_owner_verified_by ON public.customers(owner_verified_by);
CREATE INDEX IF NOT EXISTS idx_customers_owner_changed_by ON public.customers(owner_changed_by);
CREATE INDEX IF NOT EXISTS idx_customers_non_pima_verified_by ON public.customers(non_pima_verified_by);

-- Inventory items
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON public.inventory_items(user_id);

-- Manuals
CREATE INDEX IF NOT EXISTS idx_manuals_user_id ON public.manuals(user_id);

-- Parts diagrams
CREATE INDEX IF NOT EXISTS idx_parts_diagrams_user_id ON public.parts_diagrams(user_id);

-- Pima assessor records
CREATE INDEX IF NOT EXISTS idx_pima_assessor_records_owner_updated_by ON public.pima_assessor_records(owner_updated_by);

-- QuickBooks connections
CREATE INDEX IF NOT EXISTS idx_quickbooks_connections_user_id ON public.quickbooks_connections(user_id);

-- QuickBooks customer sync
CREATE INDEX IF NOT EXISTS idx_quickbooks_customer_sync_user_id ON public.quickbooks_customer_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_quickbooks_customer_sync_customer_id ON public.quickbooks_customer_sync(customer_id);

-- QuickBooks invoice sync
CREATE INDEX IF NOT EXISTS idx_quickbooks_invoice_sync_user_id ON public.quickbooks_invoice_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_quickbooks_invoice_sync_service_record_id ON public.quickbooks_invoice_sync(service_record_id);

-- Saved service routes
CREATE INDEX IF NOT EXISTS idx_saved_service_routes_user_id ON public.saved_service_routes(user_id);

-- Service records
CREATE INDEX IF NOT EXISTS idx_service_records_user_id ON public.service_records(user_id);
CREATE INDEX IF NOT EXISTS idx_service_records_customer_id ON public.service_records(customer_id);

-- TSBs
CREATE INDEX IF NOT EXISTS idx_tsbs_user_id ON public.tsbs(user_id);

-- User roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Additional composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON public.appointments(user_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_date ON public.appointments(customer_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_service_records_customer_date ON public.service_records(customer_id, service_date);
CREATE INDEX IF NOT EXISTS idx_service_records_user_date ON public.service_records(user_id, service_date);
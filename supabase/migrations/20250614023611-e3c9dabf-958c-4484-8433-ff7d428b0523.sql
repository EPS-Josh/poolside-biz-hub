
-- Check if RLS is enabled and enable if not (this will not error if already enabled)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_service_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_photos ENABLE ROW LEVEL SECURITY;

-- Create policies that don't exist yet for customers table
DO $$
BEGIN
    -- Try to create each policy, ignore if it already exists
    BEGIN
        EXECUTE 'CREATE POLICY "Users can create their own customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, continue
    END;
    
    BEGIN
        EXECUTE 'CREATE POLICY "Users can update their own customers" ON public.customers FOR UPDATE USING (auth.uid() = user_id)';
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, continue
    END;
    
    BEGIN
        EXECUTE 'CREATE POLICY "Users can delete their own customers" ON public.customers FOR DELETE USING (auth.uid() = user_id)';
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, continue
    END;
END $$;

-- Create policies for customer_service_details
DO $$
BEGIN
    BEGIN
        EXECUTE 'CREATE POLICY "Users can view service details for their customers" ON public.customer_service_details FOR SELECT USING (EXISTS (SELECT 1 FROM public.customers WHERE customers.id = customer_service_details.customer_id AND customers.user_id = auth.uid()))';
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, continue
    END;
    
    BEGIN
        EXECUTE 'CREATE POLICY "Users can create service details for their customers" ON public.customer_service_details FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.customers WHERE customers.id = customer_service_details.customer_id AND customers.user_id = auth.uid()))';
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, continue
    END;
    
    BEGIN
        EXECUTE 'CREATE POLICY "Users can update service details for their customers" ON public.customer_service_details FOR UPDATE USING (EXISTS (SELECT 1 FROM public.customers WHERE customers.id = customer_service_details.customer_id AND customers.user_id = auth.uid()))';
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, continue
    END;
    
    BEGIN
        EXECUTE 'CREATE POLICY "Users can delete service details for their customers" ON public.customer_service_details FOR DELETE USING (EXISTS (SELECT 1 FROM public.customers WHERE customers.id = customer_service_details.customer_id AND customers.user_id = auth.uid()))';
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, continue
    END;
END $$;

-- Create policies for service_records
DO $$
BEGIN
    BEGIN
        EXECUTE 'CREATE POLICY "Users can view their own service records" ON public.service_records FOR SELECT USING (auth.uid() = user_id)';
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, continue
    END;
    
    BEGIN
        EXECUTE 'CREATE POLICY "Users can create their own service records" ON public.service_records FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, continue
    END;
    
    BEGIN
        EXECUTE 'CREATE POLICY "Users can update their own service records" ON public.service_records FOR UPDATE USING (auth.uid() = user_id)';
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, continue
    END;
    
    BEGIN
        EXECUTE 'CREATE POLICY "Users can delete their own service records" ON public.service_records FOR DELETE USING (auth.uid() = user_id)';
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, continue
    END;
END $$;

-- Create policies for customer_photos
DO $$
BEGIN
    BEGIN
        EXECUTE 'CREATE POLICY "Users can view photos for their customers" ON public.customer_photos FOR SELECT USING (EXISTS (SELECT 1 FROM public.customers WHERE customers.id = customer_photos.customer_id AND customers.user_id = auth.uid()))';
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, continue
    END;
    
    BEGIN
        EXECUTE 'CREATE POLICY "Users can create photos for their customers" ON public.customer_photos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.customers WHERE customers.id = customer_photos.customer_id AND customers.user_id = auth.uid()))';
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, continue
    END;
    
    BEGIN
        EXECUTE 'CREATE POLICY "Users can update photos for their customers" ON public.customer_photos FOR UPDATE USING (EXISTS (SELECT 1 FROM public.customers WHERE customers.id = customer_photos.customer_id AND customers.user_id = auth.uid()))';
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, continue
    END;
    
    BEGIN
        EXECUTE 'CREATE POLICY "Users can delete photos for their customers" ON public.customer_photos FOR DELETE USING (EXISTS (SELECT 1 FROM public.customers WHERE customers.id = customer_photos.customer_id AND customers.user_id = auth.uid()))';
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, continue
    END;
END $$;

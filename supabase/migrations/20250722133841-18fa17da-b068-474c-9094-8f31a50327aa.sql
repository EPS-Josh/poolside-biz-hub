-- Create QuickBooks integration tracking tables

-- Table to store QuickBooks connection info
CREATE TABLE public.quickbooks_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quickbooks_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own QuickBooks connections" 
ON public.quickbooks_connections 
FOR ALL 
USING ((select auth.uid()) = user_id);

-- Table to track invoice sync status
CREATE TABLE public.quickbooks_invoice_sync (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_record_id UUID NOT NULL,
  quickbooks_invoice_id TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (service_record_id) REFERENCES public.service_records(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.quickbooks_invoice_sync ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own invoice sync records" 
ON public.quickbooks_invoice_sync 
FOR ALL 
USING ((select auth.uid()) = user_id);

-- Table to track customer sync status
CREATE TABLE public.quickbooks_customer_sync (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  quickbooks_customer_id TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.quickbooks_customer_sync ENABLE ROW LEVEL SECURITY;

-- RLS policies  
CREATE POLICY "Users can manage their own customer sync records" 
ON public.quickbooks_customer_sync 
FOR ALL 
USING ((select auth.uid()) = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_quickbooks_connections_updated_at
BEFORE UPDATE ON public.quickbooks_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quickbooks_invoice_sync_updated_at
BEFORE UPDATE ON public.quickbooks_invoice_sync
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quickbooks_customer_sync_updated_at
BEFORE UPDATE ON public.quickbooks_customer_sync
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
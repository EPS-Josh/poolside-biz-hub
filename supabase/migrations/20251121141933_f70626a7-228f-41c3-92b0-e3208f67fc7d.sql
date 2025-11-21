-- Create SMS logs table to track all sent messages
CREATE TABLE public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  message_sid TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Admins and managers can view all SMS logs
CREATE POLICY "Admins and managers can view all SMS logs"
ON public.sms_logs
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- System can insert SMS logs (from edge function)
CREATE POLICY "System can insert SMS logs"
ON public.sms_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for faster queries
CREATE INDEX idx_sms_logs_user_id ON public.sms_logs(user_id);
CREATE INDEX idx_sms_logs_customer_id ON public.sms_logs(customer_id);
CREATE INDEX idx_sms_logs_status ON public.sms_logs(status);
CREATE INDEX idx_sms_logs_sent_at ON public.sms_logs(sent_at DESC);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_sms_logs_updated_at
BEFORE UPDATE ON public.sms_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
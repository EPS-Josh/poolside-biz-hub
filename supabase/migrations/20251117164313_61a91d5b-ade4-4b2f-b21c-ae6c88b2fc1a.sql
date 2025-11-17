-- Clean up duplicate records, keeping only the most recent one for each customer
WITH ranked_records AS (
  SELECT 
    id,
    customer_id,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id 
      ORDER BY updated_at DESC NULLS LAST, created_at DESC
    ) as rn
  FROM public.customer_service_details
)
DELETE FROM public.customer_service_details
WHERE id IN (
  SELECT id FROM ranked_records WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE public.customer_service_details 
ADD CONSTRAINT customer_service_details_customer_id_key UNIQUE (customer_id);

-- Add comment
COMMENT ON CONSTRAINT customer_service_details_customer_id_key ON public.customer_service_details 
IS 'Ensures one service details record per customer';
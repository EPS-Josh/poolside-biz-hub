-- Create an optimized function for fast address lookup
CREATE OR REPLACE FUNCTION public.search_assessor_by_address(search_address text)
RETURNS TABLE (
  id uuid,
  "Parcel" text,
  "Mail1" text,
  "Mail2" text,
  "Mail3" text,
  "Mail4" text,
  "Mail5" text,
  "Zip" text,
  "Zip4" text,
  updated_owner_name text,
  is_owner_updated boolean,
  owner_updated_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First try exact match (fastest)
  RETURN QUERY
  SELECT 
    p.id,
    p."Parcel",
    p."Mail1",
    p."Mail2",
    p."Mail3",
    p."Mail4",
    p."Mail5",
    p."Zip",
    p."Zip4",
    p.updated_owner_name,
    p.is_owner_updated,
    p.owner_updated_at,
    p.updated_at
  FROM pima_assessor_records p
  WHERE p."Mail2" = search_address OR p."Mail3" = search_address
  LIMIT 1;
  
  -- If no exact match, try starts-with (using index)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      p.id,
      p."Parcel",
      p."Mail1",
      p."Mail2",
      p."Mail3",
      p."Mail4",
      p."Mail5",
      p."Zip",
      p."Zip4",
      p.updated_owner_name,
      p.is_owner_updated,
      p.owner_updated_at,
      p.updated_at
    FROM pima_assessor_records p
    WHERE p."Mail2" ILIKE search_address || '%' 
       OR p."Mail3" ILIKE search_address || '%'
    LIMIT 1;
  END IF;
  
  -- Only if still not found, do the slower contains search (last resort)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      p.id,
      p."Parcel",
      p."Mail1",
      p."Mail2",
      p."Mail3",
      p."Mail4",
      p."Mail5",
      p."Zip",
      p."Zip4",
      p.updated_owner_name,
      p.is_owner_updated,
      p.owner_updated_at,
      p.updated_at
    FROM pima_assessor_records p
    WHERE p."Mail2" ILIKE '%' || search_address || '%'
       OR p."Mail3" ILIKE '%' || search_address || '%'
    LIMIT 1;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.search_assessor_by_address(text) TO authenticated;
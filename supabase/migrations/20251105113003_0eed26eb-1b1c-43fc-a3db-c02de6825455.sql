-- Fix security and performance for search functions
DROP FUNCTION IF EXISTS search_assessor_by_last_name(text);
DROP FUNCTION IF EXISTS search_assessor_global(text, int, int);

-- Create optimized last name search with SECURITY DEFINER
CREATE OR REPLACE FUNCTION search_assessor_by_last_name(search_term TEXT)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  is_owner_updated boolean,
  owner_updated_at timestamptz,
  owner_updated_by uuid,
  "Parcel" text,
  "Mail1" text,
  "Mail2" text,
  "Mail3" text,
  "Mail4" text,
  "Mail5" text,
  "Zip" text,
  "Zip4" text,
  updated_owner_name text
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    par.id,
    par.created_at,
    par.updated_at,
    par.is_owner_updated,
    par.owner_updated_at,
    par.owner_updated_by,
    par."Parcel",
    par."Mail1",
    par."Mail2",
    par."Mail3",
    par."Mail4",
    par."Mail5",
    par."Zip",
    par."Zip4",
    par.updated_owner_name
  FROM pima_assessor_records par
  WHERE 
    UPPER(TRIM(COALESCE(par."Mail1", ''))) LIKE UPPER(TRIM(search_term)) || '%'
    OR UPPER(TRIM(COALESCE(par.updated_owner_name, ''))) LIKE UPPER(TRIM(search_term)) || '%'
  LIMIT 50;
END;
$$;

-- Create optimized global search with SECURITY DEFINER  
CREATE OR REPLACE FUNCTION search_assessor_global(search_term TEXT, offset_val INT DEFAULT 0, limit_val INT DEFAULT 20)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  is_owner_updated boolean,
  owner_updated_at timestamptz,
  owner_updated_by uuid,
  "Parcel" text,
  "Mail1" text,
  "Mail2" text,
  "Mail3" text,
  "Mail4" text,
  "Mail5" text,
  "Zip" text,
  "Zip4" text,
  updated_owner_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trimmed_search TEXT := UPPER(TRIM(search_term));
BEGIN
  RETURN QUERY
  SELECT 
    par.id,
    par.created_at,
    par.updated_at,
    par.is_owner_updated,
    par.owner_updated_at,
    par.owner_updated_by,
    par."Parcel",
    par."Mail1",
    par."Mail2",
    par."Mail3",
    par."Mail4",
    par."Mail5",
    par."Zip",
    par."Zip4",
    par.updated_owner_name
  FROM pima_assessor_records par
  WHERE 
    UPPER(TRIM(COALESCE(par."Parcel", ''))) LIKE '%' || trimmed_search || '%'
    OR UPPER(TRIM(COALESCE(par."Mail1", ''))) LIKE '%' || trimmed_search || '%'
    OR UPPER(TRIM(COALESCE(par.updated_owner_name, ''))) LIKE '%' || trimmed_search || '%'
    OR UPPER(TRIM(COALESCE(par."Mail2", ''))) LIKE '%' || trimmed_search || '%'
    OR UPPER(TRIM(COALESCE(par."Mail3", ''))) LIKE '%' || trimmed_search || '%'
  OFFSET offset_val
  LIMIT limit_val;
END;
$$;
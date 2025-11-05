-- Create function for trimmed last name search
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
) AS $$
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
    UPPER(TRIM(par."Mail1")) LIKE UPPER(search_term) || '%'
    OR UPPER(TRIM(par.updated_owner_name)) LIKE UPPER(search_term) || '%'
  LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function for global assessor search
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
) AS $$
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
    UPPER(TRIM(par."Mail1")) LIKE '%' || UPPER(search_term) || '%'
    OR UPPER(TRIM(par.updated_owner_name)) LIKE '%' || UPPER(search_term) || '%'
    OR UPPER(TRIM(par."Mail2")) LIKE '%' || UPPER(search_term) || '%'
    OR UPPER(TRIM(par."Mail3")) LIKE '%' || UPPER(search_term) || '%'
    OR UPPER(TRIM(par."Parcel")) LIKE '%' || UPPER(search_term) || '%'
  OFFSET offset_val
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql STABLE;
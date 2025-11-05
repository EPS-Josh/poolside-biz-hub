-- Fix search path for security
ALTER FUNCTION search_assessor_by_last_name(TEXT) SET search_path = public;
ALTER FUNCTION search_assessor_global(TEXT, INT, INT) SET search_path = public;
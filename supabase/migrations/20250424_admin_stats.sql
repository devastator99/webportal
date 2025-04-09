
-- Create function to get total clinics count
CREATE OR REPLACE FUNCTION public.get_admin_clinics_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clinics_count INTEGER;
BEGIN
  -- Count distinct clinic locations that are not null
  SELECT COUNT(DISTINCT clinic_location)
  INTO clinics_count
  FROM profiles
  WHERE clinic_location IS NOT NULL 
    AND clinic_location <> '';
    
  RETURN COALESCE(clinics_count, 0);
END;
$$;

-- Create function to get total users count
CREATE OR REPLACE FUNCTION public.get_admin_users_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  users_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO users_count
  FROM user_roles;
    
  RETURN COALESCE(users_count, 0);
END;
$$;

-- Create function to check system status
CREATE OR REPLACE FUNCTION public.get_system_status()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For now, just return 'Operational' if we can run this function
  RETURN 'Operational';
EXCEPTION WHEN OTHERS THEN
  RETURN 'Issue Detected';
END;
$$;

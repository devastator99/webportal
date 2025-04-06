
-- Function to get all users with their roles
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    auth.users.email,
    p.first_name,
    p.last_name,
    ur.role::TEXT
  FROM 
    profiles p
    JOIN auth.users ON p.id = auth.users.id
    LEFT JOIN user_roles ur ON p.id = ur.user_id;
END;
$$;

-- Check if a user exists
CREATE OR REPLACE FUNCTION public.check_user_exists(p_email TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  ) INTO user_exists;
  
  RETURN user_exists;
END;
$$;

-- Grant execute permission to all functions
GRANT EXECUTE ON FUNCTION public.get_users_with_roles TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_user_exists TO anon, authenticated, service_role;

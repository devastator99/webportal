
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
    ur.role
  FROM 
    profiles p
    JOIN auth.users ON p.id = auth.users.id
    JOIN user_roles ur ON p.id = ur.user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_users_with_roles TO anon, authenticated, service_role;

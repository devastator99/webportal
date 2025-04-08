
-- Add a dedicated function to safely get user roles without triggering recursion
CREATE OR REPLACE FUNCTION public.get_user_role_by_ids(user_ids UUID[])
RETURNS TABLE(user_id UUID, role TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT ur.user_id, ur.role::TEXT
  FROM user_roles ur
  WHERE ur.user_id = ANY(user_ids);
END;
$$;

-- Grant execute permission to all authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role_by_ids TO authenticated;

-- Create an additional function to get a user's role safely
CREATE OR REPLACE FUNCTION public.get_user_role(lookup_user_id UUID)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::TEXT INTO v_role
  FROM user_roles
  WHERE user_id = lookup_user_id
  LIMIT 1;
  
  RETURN v_role;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;

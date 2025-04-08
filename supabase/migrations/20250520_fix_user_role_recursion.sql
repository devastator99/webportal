
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

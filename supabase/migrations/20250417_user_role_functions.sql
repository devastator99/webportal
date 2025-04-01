
-- Function to get users by role
CREATE OR REPLACE FUNCTION public.get_users_by_role(role_name TEXT)
RETURNS JSONB[]
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB[];
BEGIN
  SELECT array_agg(jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name
  ))
  INTO v_result
  FROM profiles p
  JOIN user_roles ur ON p.id = ur.user_id
  WHERE ur.role = role_name;
  
  RETURN COALESCE(v_result, '[]'::jsonb[]);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_users_by_role TO anon, authenticated, service_role;


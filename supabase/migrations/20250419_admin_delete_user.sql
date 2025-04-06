
-- Function to allow administrators to delete users
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID, p_admin_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_admin_role TEXT;
BEGIN
  -- Check if admin_id is provided
  IF p_admin_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Administrator ID is required'
    );
  END IF;

  -- Verify the admin has the administrator role
  SELECT role INTO v_admin_role 
  FROM user_roles 
  WHERE user_id = p_admin_id 
  LIMIT 1;
  
  IF v_admin_role IS NULL OR v_admin_role <> 'administrator' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Only administrators can delete users'
    );
  END IF;
  
  -- Delete user's profile and role entries (auth.users will be handled by the Edge Function)
  DELETE FROM profiles WHERE id = p_user_id;
  DELETE FROM user_roles WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'User deleted successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute permission to authenticated users (admins will be checked in the function)
GRANT EXECUTE ON FUNCTION public.admin_delete_user TO authenticated;

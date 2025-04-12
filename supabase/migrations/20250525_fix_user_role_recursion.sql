
-- Create a dedicated function to safely get user roles without triggering recursion
CREATE OR REPLACE FUNCTION public.get_user_role_safe(p_user_id UUID)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- This function runs with the security of the function owner,
  -- bypassing row level security policies
  SELECT role::TEXT INTO v_role
  FROM user_roles 
  WHERE user_id = p_user_id
  LIMIT 1;
  
  RETURN v_role;
END;
$$;

-- Grant execute permission to all authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role_safe TO authenticated;

-- Create a function to check if a user has a specific role without triggering recursion
CREATE OR REPLACE FUNCTION public.user_has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = p_user_id 
    AND role = p_role::user_type
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.user_has_role TO authenticated;

-- Update the PatientPrescriptionsPage to use the safe function call
-- This requires updating the code that uses the user role information

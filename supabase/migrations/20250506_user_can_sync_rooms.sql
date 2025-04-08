
-- Create a function to check if a user can sync rooms (admins only)
CREATE OR REPLACE FUNCTION public.user_can_sync_rooms()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user is an administrator
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrator'
  );
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION public.user_can_sync_rooms() TO authenticated;


-- Create a function to check if the current user can sync rooms
CREATE OR REPLACE FUNCTION public.user_can_sync_rooms()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'administrator'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.user_can_sync_rooms() TO authenticated;

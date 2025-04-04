
-- Function to get user profile by ID with proper security
CREATE OR REPLACE FUNCTION public.get_user_profile(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name
  FROM profiles p
  WHERE p.id = p_user_id;
END;
$$;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION public.get_user_profile(UUID) TO authenticated, anon, service_role;


-- Create a function to safely get room members without recursion issues
CREATE OR REPLACE FUNCTION public.get_room_members_safe(p_room_id UUID)
RETURNS TABLE (
  user_id UUID,
  room_id UUID,
  role TEXT,
  first_name TEXT,
  last_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rm.user_id, 
    rm.room_id, 
    rm.role,
    p.first_name,
    p.last_name
  FROM 
    room_members rm
  LEFT JOIN
    profiles p ON p.id = rm.user_id
  WHERE 
    rm.room_id = p_room_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_room_members_safe TO authenticated;

-- Add a comment to the function
COMMENT ON FUNCTION public.get_room_members_safe IS 'Safely get all members of a chat room without recursion issues';


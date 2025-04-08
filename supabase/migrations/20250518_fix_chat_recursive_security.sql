
-- Fix for potential recursive policy issues by creating dedicated security definer functions

-- Create a function to check if a user is a member of a room without using RLS
CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM room_members 
    WHERE room_id = p_room_id AND user_id = p_user_id
  );
END;
$$;

-- Function to get room members with security definer
CREATE OR REPLACE FUNCTION public.get_room_members(p_room_id UUID)
RETURNS TABLE(
  id UUID,
  room_id UUID,
  user_id UUID,
  role TEXT,
  joined_at TIMESTAMP WITH TIME ZONE,
  user_first_name TEXT,
  user_last_name TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- First verify the user is a member of this room
  IF NOT EXISTS (
    SELECT 1 FROM room_members 
    WHERE room_id = p_room_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not a member of this room';
  END IF;

  -- Return the members with their profile information
  RETURN QUERY
  SELECT 
    rm.id,
    rm.room_id,
    rm.user_id,
    rm.role,
    rm.joined_at,
    p.first_name as user_first_name,
    p.last_name as user_last_name
  FROM room_members rm
  LEFT JOIN profiles p ON rm.user_id = p.id
  WHERE rm.room_id = p_room_id;
END;
$$;

-- Updated function for room messages to avoid recursive policies
CREATE OR REPLACE FUNCTION public.get_room_messages(p_room_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid, sender_id uuid, sender_name text, sender_role text, message text, is_system_message boolean, is_ai_message boolean, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First verify the user is a member of this room using direct table access
  -- This avoids triggering RLS policies which might cause recursion
  IF NOT EXISTS (
    SELECT 1 FROM room_members 
    WHERE room_id = p_room_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not a member of this room';
  END IF;

  -- Return the messages
  RETURN QUERY
  SELECT 
    rm.id,
    rm.sender_id,
    CASE
      WHEN rm.sender_id = '00000000-0000-0000-0000-000000000000' THEN 'AI Assistant'
      ELSE COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')
    END as sender_name,
    COALESCE(ur.role, 'unknown') as sender_role,
    rm.message,
    rm.is_system_message,
    rm.is_ai_message,
    rm.created_at
  FROM room_messages rm
  LEFT JOIN profiles p ON rm.sender_id = p.id
  LEFT JOIN user_roles ur ON rm.sender_id = ur.user_id
  WHERE rm.room_id = p_room_id
  ORDER BY rm.created_at ASC
  LIMIT p_limit OFFSET p_offset;
  
  -- Mark messages as read (avoids potential recursion by using a direct update)
  UPDATE room_messages
  SET read_by = read_by || jsonb_build_array(auth.uid())
  WHERE 
    room_id = p_room_id AND
    NOT read_by @> jsonb_build_array(auth.uid());
END;
$$;

-- Add permission for the new functions
GRANT EXECUTE ON FUNCTION public.is_room_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_room_members TO authenticated;

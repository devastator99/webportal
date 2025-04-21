
-- Update the get_room_messages function to properly handle patient roles
CREATE OR REPLACE FUNCTION public.get_room_messages(
  p_room_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_user_role TEXT DEFAULT 'patient'
)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  sender_name TEXT,
  sender_role TEXT,
  message TEXT,
  is_system_message BOOLEAN,
  is_ai_message BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- First verify the user is a member of this room
  IF NOT EXISTS (
    SELECT 1 FROM room_members 
    WHERE room_id = p_room_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not a member of this room';
  END IF;

  -- Return the messages with proper role handling
  RETURN QUERY
  SELECT 
    rm.id,
    rm.sender_id,
    CASE
      WHEN rm.sender_id = '00000000-0000-0000-0000-000000000000' THEN 'AI Assistant'
      ELSE COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')
    END as sender_name,
    CASE
      WHEN rm.is_system_message THEN 'system'
      WHEN rm.is_ai_message OR rm.sender_id = '00000000-0000-0000-0000-000000000000' THEN 'aibot'
      WHEN rmem.role IS NOT NULL THEN rmem.role
      ELSE p_user_role  -- Use the provided role as fallback
    END as sender_role,
    rm.message,
    rm.is_system_message,
    rm.is_ai_message,
    rm.created_at
  FROM room_messages rm
  LEFT JOIN profiles p ON rm.sender_id = p.id
  LEFT JOIN room_members rmem ON rm.sender_id = rmem.user_id AND rmem.room_id = p_room_id
  WHERE rm.room_id = p_room_id
  ORDER BY rm.created_at ASC
  LIMIT p_limit OFFSET p_offset;
  
  -- Mark messages as read
  UPDATE room_messages
  SET read_by = CASE 
    WHEN read_by IS NULL THEN jsonb_build_array(auth.uid())
    WHEN NOT read_by @> jsonb_build_array(auth.uid()) THEN read_by || jsonb_build_array(auth.uid())
    ELSE read_by
  END
  WHERE 
    room_id = p_room_id AND
    (read_by IS NULL OR NOT read_by @> jsonb_build_array(auth.uid()));
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_room_messages TO authenticated;

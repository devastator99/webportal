CREATE OR REPLACE FUNCTION public.get_room_messages(p_room_id UUID, p_limit INT DEFAULT 100, p_offset INT DEFAULT 0)
RETURNS TABLE (
  id UUID,
  room_id UUID,
  sender_id UUID,
  message TEXT,
  created_at TIMESTAMPTZ,
  is_system_message BOOLEAN,
  is_ai_message BOOLEAN,
  sender_name TEXT,
  sender_role TEXT
) LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- First verify the user is a member of this room or has admin privileges
  IF NOT EXISTS (
    SELECT 1 FROM room_members 
    WHERE room_id = p_room_id AND user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'administrator'
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not a member of this room';
  END IF;

  -- Return the messages with proper sorting (oldest first)
  RETURN QUERY
  SELECT 
    rm.id,
    rm.room_id,
    rm.sender_id,
    rm.message,
    rm.created_at,
    rm.is_system_message,
    rm.is_ai_message,
    CASE 
      WHEN rm.is_system_message THEN 'System'
      WHEN rm.is_ai_message OR rm.sender_id = '00000000-0000-0000-0000-000000000000' THEN 'AI Assistant'
      ELSE COALESCE(p.first_name || ' ' || p.last_name, 'Unknown User')
    END AS sender_name,
    CASE
      WHEN rm.is_system_message THEN 'system'
      WHEN rm.is_ai_message OR rm.sender_id = '00000000-0000-0000-0000-000000000000' THEN 'aibot'
      ELSE COALESCE(
        (SELECT role FROM user_roles WHERE user_id = rm.sender_id LIMIT 1)::TEXT,
        'member'
      )
    END AS sender_role
  FROM room_messages rm
  LEFT JOIN profiles p ON rm.sender_id = p.id
  WHERE rm.room_id = p_room_id
  ORDER BY rm.created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
  
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
GRANT EXECUTE ON FUNCTION public.get_room_messages TO anon;
GRANT EXECUTE ON FUNCTION public.get_room_messages TO service_role;

-- Ensure AI bot is added to all existing care team rooms
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM chat_rooms WHERE room_type = 'care_team' LOOP
    -- Check if AI bot is already a member
    IF NOT EXISTS (
      SELECT 1 FROM room_members 
      WHERE room_id = r.id AND user_id = '00000000-0000-0000-0000-000000000000'
    ) THEN
      -- Add AI bot as a member
      INSERT INTO room_members (room_id, user_id, role)
      VALUES (r.id, '00000000-0000-0000-0000-000000000000', 'aibot');
    END IF;
  END LOOP;
END
$$;

-- Create index to improve performance of message queries
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_sender_id ON room_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON room_messages(created_at);


-- Updated function to add character limit validation
CREATE OR REPLACE FUNCTION public.send_room_message(p_room_id UUID, p_message TEXT, p_is_system_message BOOLEAN DEFAULT false, p_is_ai_message BOOLEAN DEFAULT false)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_id UUID;
  v_character_limit CONSTANT INTEGER := 1000;
BEGIN
  -- Verify sender is a member of the room
  IF NOT EXISTS (
    SELECT 1 FROM room_members 
    WHERE room_id = p_room_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not a member of this room';
  END IF;
  
  -- Validate message length
  IF LENGTH(p_message) > v_character_limit AND NOT p_is_system_message AND NOT p_is_ai_message THEN
    RAISE EXCEPTION 'Message exceeds the maximum character limit of %', v_character_limit;
  END IF;
  
  -- Insert the message
  INSERT INTO room_messages (
    room_id,
    sender_id,
    message,
    is_system_message,
    is_ai_message,
    read_by
  )
  VALUES (
    p_room_id,
    auth.uid(),
    p_message,
    p_is_system_message,
    p_is_ai_message,
    jsonb_build_array(auth.uid()) -- Mark as read by sender
  )
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.send_room_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_room_message TO anon;
GRANT EXECUTE ON FUNCTION public.send_room_message TO service_role;

-- Updated function to properly handle user types and room messages with reduced page size
CREATE OR REPLACE FUNCTION public.get_room_messages(p_room_id UUID, p_limit INT DEFAULT 30, p_offset INT DEFAULT 0)
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
      ELSE CONCAT(p.first_name, ' ', p.last_name)
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
  ORDER BY rm.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_room_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_room_messages TO anon;
GRANT EXECUTE ON FUNCTION public.get_room_messages TO service_role;

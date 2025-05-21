
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

-- Updated function to properly handle user types and room messages with no message limit
CREATE OR REPLACE FUNCTION public.get_room_messages(p_room_id UUID, p_limit INT DEFAULT NULL, p_offset INT DEFAULT 0)
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
  -- Set default limit to a high number if NULL to effectively remove the limit
  p_limit := COALESCE(p_limit, 10000);
  
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

-- Updated function to handle room messages with roles (no message limit)
CREATE OR REPLACE FUNCTION public.get_room_messages_with_role(p_room_id UUID, p_limit INT DEFAULT NULL, p_offset INT DEFAULT 0, p_user_role TEXT DEFAULT 'patient'::TEXT)
RETURNS TABLE(id UUID, sender_id UUID, sender_name TEXT, sender_role TEXT, message TEXT, is_system_message BOOLEAN, is_ai_message BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_valid_role TEXT;
BEGIN
  -- Set default limit to a high number if NULL to effectively remove the limit
  p_limit := COALESCE(p_limit, 10000);
  
  -- Validate user_role to prevent enum cast errors
  v_valid_role := CASE 
    WHEN p_user_role IN ('patient', 'doctor', 'nutritionist', 'administrator', 'reception', 'aibot', 'system') THEN p_user_role
    ELSE 'patient' -- Default to patient for any invalid role
  END;

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
      WHEN rmem.role IS NOT NULL THEN rmem.role::TEXT
      ELSE v_valid_role  -- Use the validated role as fallback
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_room_messages_with_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_room_messages_with_role TO anon;
GRANT EXECUTE ON FUNCTION public.get_room_messages_with_role TO service_role;

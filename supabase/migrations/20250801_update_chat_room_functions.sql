
-- Update function to support pagination and load more messages
CREATE OR REPLACE FUNCTION public.get_room_messages(
  p_room_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  sender_id UUID,
  sender_name TEXT,
  sender_role TEXT,
  message TEXT,
  is_system_message BOOLEAN,
  is_ai_message BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
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

  -- Return the messages with pagination
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
  ORDER BY rm.created_at DESC
  LIMIT p_limit OFFSET p_offset;
  
  -- Mark messages as read
  UPDATE room_messages
  SET read_by = read_by || jsonb_build_array(auth.uid())
  WHERE 
    room_id = p_room_id AND
    NOT read_by @> jsonb_build_array(auth.uid());
END;
$$;

-- Create a function to count total messages in a room
CREATE OR REPLACE FUNCTION public.get_room_messages_count(
  p_room_id UUID
)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- First verify the user is a member of this room
  IF NOT EXISTS (
    SELECT 1 FROM room_members 
    WHERE room_id = p_room_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not a member of this room';
  END IF;

  -- Count messages
  SELECT COUNT(*)
  INTO v_count
  FROM room_messages
  WHERE room_id = p_room_id;
  
  RETURN v_count;
END;
$$;

-- Create a function to generate chat summary using AI
CREATE OR REPLACE FUNCTION public.request_chat_summary(
  p_room_id UUID,
  p_message_count INTEGER DEFAULT 100
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_role TEXT;
  v_summary_id UUID;
  v_patient_id UUID;
BEGIN
  -- Verify the user is a member of this room
  IF NOT EXISTS (
    SELECT 1 FROM room_members 
    WHERE room_id = p_room_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not a member of this room';
  END IF;
  
  -- Check if user is doctor or nutritionist
  SELECT role INTO v_user_role
  FROM user_roles
  WHERE user_id = auth.uid();
  
  IF v_user_role NOT IN ('doctor', 'nutritionist') THEN
    RAISE EXCEPTION 'Only doctors and nutritionists can generate summaries';
  END IF;
  
  -- Get patient ID for this care team room
  SELECT patient_id INTO v_patient_id
  FROM chat_rooms
  WHERE id = p_room_id;
  
  -- Create a system message indicating summary was requested
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
    'Requested a summary of the conversation',
    TRUE,
    FALSE,
    jsonb_build_array(auth.uid())
  )
  RETURNING id INTO v_summary_id;
  
  RETURN v_summary_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_room_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_room_messages_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_chat_summary TO authenticated;


-- Function to safely delete a room message with proper RLS checks
CREATE OR REPLACE FUNCTION public.delete_room_message(p_message_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_sender_id UUID;
  v_room_id UUID;
BEGIN
  -- Get the message details
  SELECT sender_id, room_id INTO v_sender_id, v_room_id
  FROM room_messages
  WHERE id = p_message_id;
  
  -- If no message found
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  
  -- Check if user is the sender of the message or has admin privileges
  IF auth.uid() <> v_sender_id AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrator'
  ) THEN
    RAISE EXCEPTION 'Not authorized to delete this message';
  END IF;
  
  -- Delete the message
  DELETE FROM room_messages
  WHERE id = p_message_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.delete_room_message TO authenticated;

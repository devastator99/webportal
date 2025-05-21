
-- Function to allow users to delete their own room messages using security definer
-- to avoid infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.delete_room_message(p_message_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id UUID;
  v_is_system_message BOOLEAN;
  v_is_ai_message BOOLEAN;
BEGIN
  -- Get the message sender_id and check if it's a system or AI message
  SELECT 
    sender_id, 
    is_system_message,
    is_ai_message 
  INTO 
    v_sender_id, 
    v_is_system_message,
    v_is_ai_message
  FROM room_messages
  WHERE id = p_message_id;
  
  -- Message not found
  IF v_sender_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If it's a system message or AI message, don't allow deletion
  IF v_is_system_message OR v_is_ai_message THEN
    RAISE EXCEPTION 'System and AI messages cannot be deleted';
  END IF;
  
  -- Verify the requesting user is the sender of the message
  IF v_sender_id <> auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only delete your own messages';
  END IF;
  
  -- Delete the message
  DELETE FROM room_messages
  WHERE id = p_message_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.delete_room_message TO authenticated;


-- Update the message_type enum to include 'pdf' if it doesn't already exist
DO $$
BEGIN
    -- Check if 'pdf' is already in the enum
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'message_type'
        AND e.enumlabel = 'pdf'
    ) THEN
        -- Add 'pdf' to the message_type enum
        ALTER TYPE message_type ADD VALUE 'pdf';
    END IF;
END$$;

-- Update the room_messages table to add a file_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'room_messages'
        AND column_name = 'file_url'
    ) THEN
        ALTER TABLE room_messages ADD COLUMN file_url TEXT;
    END IF;
END$$;

-- Update the function to allow handling PDF files
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

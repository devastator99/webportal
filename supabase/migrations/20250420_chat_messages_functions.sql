
-- Create enum type for message_type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
        CREATE TYPE public.message_type AS ENUM ('text', 'image', 'file');
    END IF;
END$$;

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  message_type message_type NOT NULL DEFAULT 'text',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indices for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_id ON public.chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Function to send a chat message
CREATE OR REPLACE FUNCTION public.send_chat_message(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_message TEXT,
  p_message_type TEXT
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_message_id UUID;
  v_message_type_cast message_type;
BEGIN
  -- Convert text input to message_type enum
  v_message_type_cast := p_message_type::message_type;
  
  -- Insert the new message
  INSERT INTO chat_messages (
    sender_id, 
    receiver_id, 
    message, 
    message_type
  ) 
  VALUES (
    p_sender_id, 
    p_receiver_id, 
    p_message, 
    v_message_type_cast
  )
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(
  p_user_id UUID,
  p_sender_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE chat_messages
  SET read = TRUE
  WHERE receiver_id = p_user_id AND sender_id = p_sender_id AND read = FALSE;
  
  RETURN TRUE;
END;
$$;

-- Row level security policies
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy for users to see messages they've sent or received
CREATE POLICY "Users can see their own messages" 
  ON public.chat_messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy for users to insert their own messages
CREATE POLICY "Users can send messages" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- Policy for users to update their own messages (if needed in the future)
CREATE POLICY "Users can update their own messages" 
  ON public.chat_messages 
  FOR UPDATE 
  USING (auth.uid() = sender_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.chat_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_chat_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read TO authenticated;

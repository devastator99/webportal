
-- Add explicit foreign key relationship between room_messages and profiles
DO $$
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'room_messages_sender_id_fkey'
    AND conrelid = 'room_messages'::regclass
  ) THEN
    -- Add the foreign key constraint if it doesn't exist
    ALTER TABLE public.room_messages
    ADD CONSTRAINT room_messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Update the RLS policies to use the is_room_member function
DO $$
BEGIN
  -- Update the policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'room_messages' 
    AND policyname = 'Users can view messages in their rooms'
  ) THEN
    DROP POLICY "Users can view messages in their rooms" ON public.room_messages;
    
    CREATE POLICY "Users can view messages in their rooms" 
      ON public.room_messages
      FOR SELECT
      USING (is_room_member(room_id, auth.uid()));
  END IF;
  
  -- Update the insert policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'room_messages' 
    AND policyname = 'Users can send messages to their rooms'
  ) THEN
    DROP POLICY "Users can send messages to their rooms" ON public.room_messages;
    
    CREATE POLICY "Users can send messages to their rooms" 
      ON public.room_messages
      FOR INSERT
      WITH CHECK (is_room_member(room_id, auth.uid()));
  END IF;
END
$$;

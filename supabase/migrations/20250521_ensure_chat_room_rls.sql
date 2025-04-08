
-- Ensure chat_rooms has RLS enabled
ALTER TABLE IF EXISTS public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Create policy for chat rooms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_rooms' 
    AND policyname = 'Users can view rooms they are members of'
  ) THEN
    CREATE POLICY "Users can view rooms they are members of" 
    ON public.chat_rooms
    FOR SELECT
    USING (
      -- Check if the user is a member of the room
      EXISTS (
        SELECT 1 FROM room_members 
        WHERE room_id = id AND user_id = auth.uid()
      )
      OR
      -- Or the user is the patient in a care team room
      (patient_id = auth.uid())
      OR 
      -- Or the user is a care provider (doctor, nutritionist) for the patient
      EXISTS (
        SELECT 1 FROM patient_assignments
        WHERE patient_id = chat_rooms.patient_id
        AND (doctor_id = auth.uid() OR nutritionist_id = auth.uid())
      )
    );
  END IF;
END
$$;

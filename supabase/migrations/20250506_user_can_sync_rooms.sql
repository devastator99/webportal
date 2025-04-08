
-- Create a function to check if a user can sync rooms (admins only)
CREATE OR REPLACE FUNCTION public.user_can_sync_rooms()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user is an administrator
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrator'
  );
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION public.user_can_sync_rooms() TO authenticated;

-- Update the create_care_team_room function to handle existing rooms properly
CREATE OR REPLACE FUNCTION public.create_care_team_room(p_patient_id UUID, p_doctor_id UUID, p_nutritionist_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_patient_name TEXT;
  v_room_name TEXT;
  v_ai_bot_id UUID := '00000000-0000-0000-0000-000000000000'; -- AI bot ID constant
BEGIN
  -- Get patient name for room name
  SELECT COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') INTO v_patient_name
  FROM profiles
  WHERE id = p_patient_id;
  
  -- Check if patient name is empty - don't create room if it is
  IF TRIM(v_patient_name) = '' THEN
    RAISE NOTICE 'Cannot create room for patient with empty name';
    RETURN NULL;
  END IF;
  
  -- Create room name
  v_room_name := v_patient_name || ' - Care Team';
  
  -- Check if room already exists for this patient
  SELECT id INTO v_room_id
  FROM chat_rooms
  WHERE patient_id = p_patient_id AND room_type = 'care_team';
  
  IF v_room_id IS NOT NULL THEN
    -- Room exists, clear existing members (except the patient and AI bot)
    DELETE FROM room_members 
    WHERE room_id = v_room_id 
    AND user_id != p_patient_id
    AND user_id != v_ai_bot_id;
    
    -- Update room name and description in case patient name changed
    UPDATE chat_rooms
    SET 
      name = v_room_name,
      description = 'Care team chat for ' || v_patient_name,
      updated_at = now()
    WHERE id = v_room_id;
  ELSE
    -- Create new room
    INSERT INTO chat_rooms (name, description, room_type, patient_id)
    VALUES (
      v_room_name,
      'Care team chat for ' || v_patient_name,
      'care_team',
      p_patient_id
    )
    RETURNING id INTO v_room_id;
    
    -- Add patient as member
    INSERT INTO room_members (room_id, user_id, role)
    VALUES (v_room_id, p_patient_id, 'patient');
    
    -- Add AI bot as member
    INSERT INTO room_members (room_id, user_id, role)
    VALUES (v_room_id, v_ai_bot_id, 'aibot');
    
    -- Add system message
    INSERT INTO room_messages (room_id, sender_id, message, is_system_message, is_ai_message)
    VALUES (
      v_room_id, 
      COALESCE(p_doctor_id, p_patient_id), -- Use doctor ID as sender for system message if available
      'Care team chat created. Team members can communicate here about patient care.',
      TRUE,
      TRUE
    );
  END IF;
  
  -- Add doctor as member if doctor_id is not null
  IF p_doctor_id IS NOT NULL THEN
    INSERT INTO room_members (room_id, user_id, role)
    VALUES (v_room_id, p_doctor_id, 'doctor')
    ON CONFLICT (room_id, user_id) DO UPDATE SET role = 'doctor';
  END IF;
  
  -- Add nutritionist as member if provided
  IF p_nutritionist_id IS NOT NULL THEN
    INSERT INTO room_members (room_id, user_id, role)
    VALUES (v_room_id, p_nutritionist_id, 'nutritionist')
    ON CONFLICT (room_id, user_id) DO UPDATE SET role = 'nutritionist';
  END IF;
  
  RETURN v_room_id;
END;
$$;

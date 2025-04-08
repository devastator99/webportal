
-- Create or update function to ensure doctor, nutritionist, patient and AI bot are all in room
CREATE OR REPLACE FUNCTION public.create_care_team_room(
  p_patient_id UUID,
  p_doctor_id UUID,
  p_nutritionist_id UUID DEFAULT NULL
)
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
  v_doctor_exists BOOLEAN;
  v_nutritionist_exists BOOLEAN;
  v_patient_exists BOOLEAN;
  v_aibot_exists BOOLEAN;
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
  
  -- If room exists, update members if needed
  IF v_room_id IS NOT NULL THEN
    -- Check if doctor is already a member
    IF p_doctor_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM room_members
        WHERE room_id = v_room_id AND user_id = p_doctor_id
      ) INTO v_doctor_exists;
      
      -- Add doctor as member if not already a member
      IF NOT v_doctor_exists THEN
        INSERT INTO room_members (room_id, user_id, role)
        VALUES (v_room_id, p_doctor_id, 'doctor');
        RAISE NOTICE 'Added doctor % to existing room %', p_doctor_id, v_room_id;
      END IF;
    END IF;
    
    -- Check if nutritionist is already a member
    IF p_nutritionist_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM room_members
        WHERE room_id = v_room_id AND user_id = p_nutritionist_id
      ) INTO v_nutritionist_exists;
      
      -- Add nutritionist as member if not already a member
      IF NOT v_nutritionist_exists THEN
        INSERT INTO room_members (room_id, user_id, role)
        VALUES (v_room_id, p_nutritionist_id, 'nutritionist');
        RAISE NOTICE 'Added nutritionist % to existing room %', p_nutritionist_id, v_room_id;
      END IF;
    END IF;
    
    -- Check if patient is already a member
    SELECT EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = v_room_id AND user_id = p_patient_id
    ) INTO v_patient_exists;
    
    -- Add patient as member if not already a member
    IF NOT v_patient_exists THEN
      INSERT INTO room_members (room_id, user_id, role)
      VALUES (v_room_id, p_patient_id, 'patient');
      RAISE NOTICE 'Added patient % to existing room %', p_patient_id, v_room_id;
    END IF;
    
    -- Check if AI bot is already a member
    SELECT EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = v_room_id AND user_id = v_ai_bot_id
    ) INTO v_aibot_exists;
    
    -- Add AI bot as member if not already a member
    IF NOT v_aibot_exists THEN
      INSERT INTO room_members (room_id, user_id, role)
      VALUES (v_room_id, v_ai_bot_id, 'aibot');
      RAISE NOTICE 'Added AI bot to existing room %', v_room_id;
    END IF;
    
    RETURN v_room_id;
  END IF;
  
  -- Create new room if it doesn't exist
  INSERT INTO chat_rooms (name, description, room_type, patient_id)
  VALUES (
    v_room_name,
    'Care team chat for ' || v_patient_name,
    'care_team',
    p_patient_id
  )
  RETURNING id INTO v_room_id;
  
  RAISE NOTICE 'Created new care team room % for patient %', v_room_id, p_patient_id;
  
  -- Add patient as member
  INSERT INTO room_members (room_id, user_id, role)
  VALUES (v_room_id, p_patient_id, 'patient');
  
  -- Add doctor as member if doctor_id is not null
  IF p_doctor_id IS NOT NULL THEN
    INSERT INTO room_members (room_id, user_id, role)
    VALUES (v_room_id, p_doctor_id, 'doctor');
    RAISE NOTICE 'Added doctor % to new room %', p_doctor_id, v_room_id;
  END IF;
  
  -- Add nutritionist as member if provided
  IF p_nutritionist_id IS NOT NULL THEN
    INSERT INTO room_members (room_id, user_id, role)
    VALUES (v_room_id, p_nutritionist_id, 'nutritionist');
    RAISE NOTICE 'Added nutritionist % to new room %', p_nutritionist_id, v_room_id;
  END IF;
  
  -- Add AI bot as member (now a real user in the system)
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
  
  -- Add welcome message from AI bot
  INSERT INTO room_messages (room_id, sender_id, message, is_system_message, is_ai_message)
  VALUES (
    v_room_id, 
    v_ai_bot_id,
    'Hello! I am your AI healthcare assistant. I am here to help facilitate communication between you and your healthcare team. How can I assist you today?',
    FALSE,
    TRUE
  );
  
  RETURN v_room_id;
END;
$$;

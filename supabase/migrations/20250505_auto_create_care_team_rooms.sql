
-- Create a function to create care team rooms
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
  
  -- If room exists, just return the ID
  IF v_room_id IS NOT NULL THEN
    RETURN v_room_id;
  END IF;
  
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
  
  -- Add doctor as member if doctor_id is not null
  IF p_doctor_id IS NOT NULL THEN
    INSERT INTO room_members (room_id, user_id, role)
    VALUES (v_room_id, p_doctor_id, 'doctor');
  END IF;
  
  -- Add nutritionist as member if provided
  IF p_nutritionist_id IS NOT NULL THEN
    INSERT INTO room_members (room_id, user_id, role)
    VALUES (v_room_id, p_nutritionist_id, 'nutritionist');
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
  
  RETURN v_room_id;
END;
$$;

-- Create trigger to automatically create care team room when patient assignment is made
CREATE OR REPLACE FUNCTION public.create_care_team_room_on_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_name TEXT;
BEGIN
  -- Only proceed if both patient_id and doctor_id are set
  IF NEW.patient_id IS NULL OR NEW.doctor_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if patient has a name
  SELECT TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) INTO v_patient_name
  FROM profiles
  WHERE id = NEW.patient_id;
  
  -- Don't create room if patient name is empty
  IF v_patient_name = '' THEN
    RAISE NOTICE 'Skipping room creation for patient with empty name';
    RETURN NEW;
  END IF;
  
  -- Create the room
  PERFORM public.create_care_team_room(
    NEW.patient_id,
    NEW.doctor_id,
    NEW.nutritionist_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on patient_assignments
DROP TRIGGER IF EXISTS create_care_team_room_trigger ON patient_assignments;
CREATE TRIGGER create_care_team_room_trigger
AFTER INSERT OR UPDATE OF doctor_id, nutritionist_id
ON patient_assignments
FOR EACH ROW
EXECUTE FUNCTION public.create_care_team_room_on_assignment();

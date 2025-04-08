
-- Enhanced function to sync all care team rooms with improved doctor handling
CREATE OR REPLACE FUNCTION public.sync_all_care_team_rooms()
RETURNS TABLE(patient_id UUID, room_id UUID, doctor_id UUID, nutritionist_id UUID, result TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_room_id UUID;
  v_result TEXT;
  v_doctor_exists BOOLEAN;
  v_patient_exists BOOLEAN;
BEGIN
  RAISE NOTICE 'Starting enhanced care team sync with focus on doctor memberships';
  
  -- Process each patient assignment that has a doctor assigned
  FOR r IN 
    SELECT 
      pa.patient_id, 
      pa.doctor_id, 
      pa.nutritionist_id,
      p.first_name || ' ' || p.last_name AS patient_name
    FROM 
      patient_assignments pa
    JOIN 
      profiles p ON pa.patient_id = p.id
    WHERE 
      pa.doctor_id IS NOT NULL
  LOOP
    BEGIN
      -- Create or update the care team room
      v_room_id := public.create_care_team_room(
        r.patient_id,
        r.doctor_id,
        r.nutritionist_id
      );
      
      IF v_room_id IS NULL THEN
        v_result := 'Error: Failed to create or update room';
        
        patient_id := r.patient_id;
        room_id := NULL;
        doctor_id := r.doctor_id;
        nutritionist_id := r.nutritionist_id;
        result := v_result;
        
        RETURN NEXT;
        CONTINUE;
      END IF;
      
      -- Explicitly verify doctor was added to the room
      SELECT EXISTS (
        SELECT 1 FROM room_members
        WHERE room_id = v_room_id AND user_id = r.doctor_id
      ) INTO v_doctor_exists;
      
      -- If doctor isn't in the room (should not happen with the fixed function), add them
      IF NOT v_doctor_exists THEN
        RAISE NOTICE 'Doctor % not found in room %, explicitly adding', r.doctor_id, v_room_id;
        
        INSERT INTO room_members (room_id, user_id, role)
        VALUES (v_room_id, r.doctor_id, 'doctor');
      END IF;
      
      -- Verify patient is in the room
      SELECT EXISTS (
        SELECT 1 FROM room_members
        WHERE room_id = v_room_id AND user_id = r.patient_id
      ) INTO v_patient_exists;
      
      -- If patient isn't in the room, add them
      IF NOT v_patient_exists THEN
        RAISE NOTICE 'Patient % not found in room %, explicitly adding', r.patient_id, v_room_id;
        
        INSERT INTO room_members (room_id, user_id, role)
        VALUES (v_room_id, r.patient_id, 'patient');
      END IF;
      
      -- Success result
      v_result := 'Success';
      
      patient_id := r.patient_id;
      room_id := v_room_id;
      doctor_id := r.doctor_id;
      nutritionist_id := r.nutritionist_id;
      result := v_result;
      
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      v_result := 'Error: ' || SQLERRM;
      
      patient_id := r.patient_id;
      room_id := NULL;
      doctor_id := r.doctor_id;
      nutritionist_id := r.nutritionist_id;
      result := v_result;
      
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$;

-- Create a new maintenance function to fix any rooms with missing doctors
CREATE OR REPLACE FUNCTION public.fix_care_team_rooms_missing_doctors()
RETURNS TABLE(patient_id UUID, room_id UUID, doctor_id UUID, action TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_room_id UUID;
  v_action TEXT;
BEGIN
  -- Find all rooms where doctor should be a member but isn't
  FOR r IN 
    SELECT 
      cr.id AS room_id,
      cr.patient_id,
      pa.doctor_id
    FROM 
      chat_rooms cr
    JOIN 
      patient_assignments pa ON cr.patient_id = pa.patient_id
    LEFT JOIN 
      room_members rm ON cr.id = rm.room_id AND pa.doctor_id = rm.user_id
    WHERE 
      cr.room_type = 'care_team' 
      AND pa.doctor_id IS NOT NULL
      AND rm.id IS NULL
  LOOP
    BEGIN
      -- Doctor exists in patient assignment but not in room, add them
      INSERT INTO room_members (room_id, user_id, role)
      VALUES (r.room_id, r.doctor_id, 'doctor');
      
      v_action := 'Added missing doctor';
      
      patient_id := r.patient_id;
      room_id := r.room_id;
      doctor_id := r.doctor_id;
      action := v_action;
      
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      v_action := 'Error: ' || SQLERRM;
      
      patient_id := r.patient_id;
      room_id := r.room_id;
      doctor_id := r.doctor_id;
      action := v_action;
      
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$;

-- Grant execute privileges on functions
GRANT EXECUTE ON FUNCTION public.sync_all_care_team_rooms() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_care_team_rooms_missing_doctors() TO authenticated;

-- Run the fix function to address any existing issues
SELECT * FROM public.fix_care_team_rooms_missing_doctors();


-- Add RPC function to safely get a patient's care team room

CREATE OR REPLACE FUNCTION public.get_patient_care_team_room(p_patient_id UUID)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_room_id UUID;
BEGIN
  -- Verify the user is accessing their own rooms
  IF p_patient_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'doctor', 'nutritionist')
  ) THEN
    RAISE EXCEPTION 'Access denied: User can only access their own care team room';
  END IF;

  -- Get the care team room ID
  SELECT id INTO v_room_id
  FROM chat_rooms
  WHERE patient_id = p_patient_id
    AND room_type = 'care_team'
    AND is_active = true
  LIMIT 1;
  
  -- If no room exists, create one
  IF v_room_id IS NULL THEN
    -- Get the care team assignments
    DECLARE
      v_doctor_id UUID;
      v_nutritionist_id UUID;
    BEGIN
      SELECT doctor_id, nutritionist_id 
      INTO v_doctor_id, v_nutritionist_id
      FROM patient_assignments
      WHERE patient_id = p_patient_id;
      
      -- Create room if we have at least a doctor assigned
      IF v_doctor_id IS NOT NULL THEN
        v_room_id := public.create_care_team_room(
          p_patient_id,
          v_doctor_id,
          v_nutritionist_id
        );
      END IF;
    END;
  END IF;
  
  RETURN v_room_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_patient_care_team_room TO authenticated;

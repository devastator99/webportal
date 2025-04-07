
-- Create a function to sync all care team rooms
CREATE OR REPLACE FUNCTION public.sync_all_care_team_rooms()
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment RECORD;
  v_room_id UUID;
BEGIN
  -- Iterate through all patient assignments
  FOR v_assignment IN 
    SELECT patient_id, doctor_id, nutritionist_id
    FROM patient_assignments
    WHERE doctor_id IS NOT NULL
  LOOP
    -- Create or ensure care team room exists
    v_room_id := public.create_care_team_room(
      v_assignment.patient_id,
      v_assignment.doctor_id,
      v_assignment.nutritionist_id
    );
    
    -- Return the room ID
    IF v_room_id IS NOT NULL THEN
      RETURN NEXT v_room_id;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.sync_all_care_team_rooms() TO authenticated;


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
  v_count INTEGER := 0;
  v_error TEXT;
BEGIN
  RAISE NOTICE 'Starting sync_all_care_team_rooms function';
  
  -- Log the count of patient assignments for debugging
  RAISE NOTICE 'Total patient assignments to process: %', 
    (SELECT COUNT(*) FROM patient_assignments WHERE doctor_id IS NOT NULL);
  
  -- Iterate through all patient assignments
  FOR v_assignment IN 
    SELECT pa.patient_id, pa.doctor_id, pa.nutritionist_id,
           p.first_name || ' ' || p.last_name AS patient_name
    FROM patient_assignments pa
    JOIN profiles p ON pa.patient_id = p.id
    WHERE pa.doctor_id IS NOT NULL
  LOOP
    BEGIN
      RAISE NOTICE 'Processing patient: %, doctor: %, nutritionist: %', 
                v_assignment.patient_name, 
                v_assignment.doctor_id, 
                v_assignment.nutritionist_id;
      
      -- Create or ensure care team room exists
      v_room_id := public.create_care_team_room(
        v_assignment.patient_id,
        v_assignment.doctor_id,
        v_assignment.nutritionist_id
      );
      
      -- Return the room ID if successful
      IF v_room_id IS NOT NULL THEN
        RAISE NOTICE 'Created/updated room with ID: % for patient: %', 
                    v_room_id, v_assignment.patient_name;
        v_count := v_count + 1;
        RETURN NEXT v_room_id;
      ELSE
        RAISE NOTICE 'Failed to create room for patient: % - room_id was NULL', v_assignment.patient_name;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
      RAISE NOTICE 'Error processing patient %: %', v_assignment.patient_name, v_error;
      -- Continue with the next patient even if there's an error
    END;
  END LOOP;
  
  RAISE NOTICE 'Completed sync_all_care_team_rooms, processed % rooms', v_count;
  RETURN;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.sync_all_care_team_rooms() TO authenticated;

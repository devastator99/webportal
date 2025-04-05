
-- Drop existing function if any
DROP FUNCTION IF EXISTS public.admin_assign_doctor_to_patient(uuid, uuid, uuid);

-- Create a security definer function for doctor assignment to avoid recursion issues
CREATE OR REPLACE FUNCTION public.admin_assign_doctor_to_patient(
  p_doctor_id UUID,
  p_patient_id UUID,
  p_admin_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_doctor_role TEXT;
  v_patient_role TEXT;
  v_admin_role TEXT;
  v_result JSONB;
  v_table_exists BOOLEAN;
BEGIN
  -- Verify the admin has the administrator role
  SELECT role INTO v_admin_role 
  FROM user_roles 
  WHERE user_id = p_admin_id 
  LIMIT 1;
  
  IF v_admin_role IS NULL OR v_admin_role <> 'administrator' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Only administrators can assign doctors'
    );
  END IF;
  
  -- Verify the doctor has the doctor role
  SELECT role INTO v_doctor_role 
  FROM user_roles 
  WHERE user_id = p_doctor_id 
  LIMIT 1;
  
  IF v_doctor_role IS NULL OR v_doctor_role <> 'doctor' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Provided ID is not a doctor'
    );
  END IF;
  
  -- Verify the patient has the patient role
  SELECT role INTO v_patient_role 
  FROM user_roles 
  WHERE user_id = p_patient_id 
  LIMIT 1;
  
  IF v_patient_role IS NULL OR v_patient_role <> 'patient' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Provided ID is not a patient'
    );
  END IF;

  -- Check if patient_doctor_assignments table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'patient_doctor_assignments'
  ) INTO v_table_exists;
  
  IF v_table_exists THEN
    -- First, remove any existing doctor assignment for this patient in patient_doctor_assignments
    DELETE FROM patient_doctor_assignments
    WHERE patient_id = p_patient_id;
    
    -- Then, create the new assignment in patient_doctor_assignments
    INSERT INTO patient_doctor_assignments (patient_id, doctor_id)
    VALUES (p_patient_id, p_doctor_id);
  ELSE
    -- Check if patient_assignments table exists as an alternative
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'patient_assignments'
    ) INTO v_table_exists;
    
    IF v_table_exists THEN
      -- Delete any existing assignments for this patient in patient_assignments
      DELETE FROM patient_assignments
      WHERE patient_id = p_patient_id;
      
      -- Create new assignment in patient_assignments
      INSERT INTO patient_assignments (patient_id, doctor_id)
      VALUES (p_patient_id, p_doctor_id);
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'No assignment tables found in the database'
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Doctor assigned to patient successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION public.admin_assign_doctor_to_patient(UUID, UUID, UUID) TO authenticated;

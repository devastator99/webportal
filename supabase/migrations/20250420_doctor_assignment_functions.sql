
-- Drop existing function if any
DROP FUNCTION IF EXISTS public.admin_assign_doctor_to_patient(uuid, uuid, uuid);

-- Create a security definer function for doctor assignment
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
  v_assignment_id UUID;
BEGIN
  -- Check if admin_id is provided
  IF p_admin_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Administrator ID is required'
    );
  END IF;

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

  -- Delete any existing assignments for this patient in patient_assignments
  DELETE FROM patient_assignments
  WHERE patient_id = p_patient_id;
  
  -- Create new assignment in patient_assignments
  INSERT INTO patient_assignments (patient_id, doctor_id)
  VALUES (p_patient_id, p_doctor_id)
  RETURNING id INTO v_assignment_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Doctor assigned to patient successfully',
    'id', v_assignment_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION public.admin_assign_doctor_to_patient(UUID, UUID, UUID) TO authenticated;

-- Create simplified assign_doctor_to_patient function that only works with patient_assignments table
CREATE OR REPLACE FUNCTION public.assign_doctor_to_patient(
  p_patient_id UUID,
  p_doctor_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_assignment_id UUID;
  v_doctor_exists BOOLEAN;
  v_patient_exists BOOLEAN;
BEGIN
  -- Input validation
  IF p_patient_id IS NULL OR p_doctor_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Patient ID and Doctor ID are required'
    );
  END IF;
  
  -- Check if the basic IDs exist
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = p_doctor_id) INTO v_doctor_exists;
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = p_patient_id) INTO v_patient_exists;
  
  IF NOT v_doctor_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Doctor profile not found'
    );
  END IF;
  
  IF NOT v_patient_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Patient profile not found'
    );
  END IF;
  
  -- Delete any existing assignments for this patient
  DELETE FROM patient_assignments
  WHERE patient_id = p_patient_id;
  
  -- Insert the assignment
  INSERT INTO patient_assignments(
    patient_id,
    doctor_id
  )
  VALUES (
    p_patient_id,
    p_doctor_id
  )
  RETURNING id INTO v_assignment_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Doctor assigned to patient successfully',
    'id', v_assignment_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute permission to the direct function
GRANT EXECUTE ON FUNCTION public.assign_doctor_to_patient(UUID, UUID) TO authenticated;

-- Keep direct_assign_doctor_to_patient function for backward compatibility
CREATE OR REPLACE FUNCTION public.direct_assign_doctor_to_patient(
  p_doctor_id UUID,
  p_patient_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Just redirect to the main function to avoid duplication
  RETURN public.assign_doctor_to_patient(p_patient_id, p_doctor_id);
END;
$$;

-- Grant execute permission to the direct function
GRANT EXECUTE ON FUNCTION public.direct_assign_doctor_to_patient(UUID, UUID) TO authenticated;

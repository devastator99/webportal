
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.admin_assign_care_team(uuid, uuid, uuid, uuid);

-- Create the admin_assign_care_team function
CREATE OR REPLACE FUNCTION public.admin_assign_care_team(
  p_patient_id UUID,
  p_doctor_id UUID,
  p_nutritionist_id UUID,
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
  v_nutritionist_role TEXT;
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
      'error', 'Unauthorized: Only administrators can assign care teams'
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
      'error', 'Provided doctor ID is not a doctor'
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
      'error', 'Provided patient ID is not a patient'
    );
  END IF;
  
  -- If nutritionist is provided, verify the nutritionist has the nutritionist role
  IF p_nutritionist_id IS NOT NULL THEN
    SELECT role INTO v_nutritionist_role 
    FROM user_roles 
    WHERE user_id = p_nutritionist_id 
    LIMIT 1;
    
    IF v_nutritionist_role IS NULL OR v_nutritionist_role <> 'nutritionist' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Provided nutritionist ID is not a nutritionist'
      );
    END IF;
  END IF;

  -- Delete any existing assignments for this patient
  DELETE FROM patient_assignments
  WHERE patient_id = p_patient_id;
  
  -- Create new assignment in patient_assignments with both doctor and nutritionist (if provided)
  INSERT INTO patient_assignments (patient_id, doctor_id, nutritionist_id)
  VALUES (p_patient_id, p_doctor_id, p_nutritionist_id)
  RETURNING id INTO v_assignment_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Care team assigned to patient successfully',
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
GRANT EXECUTE ON FUNCTION public.admin_assign_care_team(UUID, UUID, UUID, UUID) TO authenticated;

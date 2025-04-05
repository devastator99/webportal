
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

  -- First, remove any existing doctor assignment for this patient
  DELETE FROM patient_doctor_assignments
  WHERE patient_id = p_patient_id;
  
  -- Then, create the new assignment
  INSERT INTO patient_doctor_assignments (patient_id, doctor_id)
  VALUES (p_patient_id, p_doctor_id);
  
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


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
  v_doctor_exists BOOLEAN;
  v_patient_exists BOOLEAN;
BEGIN
  -- Check if admin_id is provided
  IF p_admin_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Administrator ID is required'
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

  -- Check if patient_assignments table exists
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
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Doctor assigned to patient successfully (using patient_assignments)'
    );
  END IF;
  
  -- If we get here, check if patient_doctor_assignments table exists
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
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Doctor assigned to patient successfully (using patient_doctor_assignments)'
    );
  END IF;
  
  -- If we get here, no appropriate tables exist
  RETURN jsonb_build_object(
    'success', false,
    'error', 'No assignment tables found in the database'
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

-- Create a direct assignment from component function as fallback
CREATE OR REPLACE FUNCTION public.direct_assign_doctor_to_patient(
  p_doctor_id UUID,
  p_patient_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_table_exists BOOLEAN;
BEGIN
  -- Try to use patient_assignments first
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'patient_assignments'
  ) INTO v_table_exists;
  
  IF v_table_exists THEN
    -- Delete any existing assignments for this patient
    DELETE FROM patient_assignments
    WHERE patient_id = p_patient_id;
    
    -- Create new assignment
    INSERT INTO patient_assignments (patient_id, doctor_id)
    VALUES (p_patient_id, p_doctor_id);
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Doctor directly assigned to patient successfully'
    );
  ELSE
    -- Check if patient_doctor_assignments exists
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'patient_doctor_assignments'
    ) INTO v_table_exists;
    
    IF v_table_exists THEN
      -- Delete any existing assignments for this patient
      DELETE FROM patient_doctor_assignments
      WHERE patient_id = p_patient_id;
      
      -- Create new assignment
      INSERT INTO patient_doctor_assignments (patient_id, doctor_id)
      VALUES (p_patient_id, p_doctor_id);
      
      RETURN jsonb_build_object(
        'success', true,
        'message', 'Doctor directly assigned to patient successfully'
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'No assignment tables found in the database'
      );
    END IF;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission to the direct function
GRANT EXECUTE ON FUNCTION public.direct_assign_doctor_to_patient(UUID, UUID) TO authenticated;

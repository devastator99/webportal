
-- Create a function to add a user role with SECURITY DEFINER privileges
CREATE OR REPLACE FUNCTION create_user_role(p_user_id UUID, p_role TEXT)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Insert the user role
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  RETURNING to_json(user_roles.*) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Create a function to get a user's role with SECURITY DEFINER privileges
CREATE OR REPLACE FUNCTION get_user_role(lookup_user_id UUID)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Get the user's role
  SELECT role INTO v_role
  FROM user_roles
  WHERE user_id = lookup_user_id
  LIMIT 1;
  
  RETURN v_role;
END;
$$;

-- Create a function to create patient details with SECURITY DEFINER privileges
CREATE OR REPLACE FUNCTION create_patient_details(
  p_user_id UUID, 
  p_age INTEGER, 
  p_gender TEXT, 
  p_blood_group TEXT, 
  p_allergies TEXT, 
  p_emergency_contact TEXT,
  p_height FLOAT,
  p_birth_date DATE,
  p_food_habit TEXT,
  p_current_medical_conditions TEXT
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Check if the patient record already exists
  IF EXISTS (SELECT 1 FROM patient_details WHERE user_id = p_user_id) THEN
    -- Update existing record
    UPDATE patient_details
    SET 
      age = p_age,
      gender = p_gender,
      blood_group = p_blood_group,
      allergies = p_allergies,
      emergency_contact = p_emergency_contact,
      height = p_height,
      birth_date = p_birth_date,
      food_habit = p_food_habit,
      current_medical_conditions = p_current_medical_conditions,
      updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING to_json(patient_details.*) INTO v_result;
  ELSE
    -- Insert new record
    INSERT INTO patient_details (
      user_id, 
      age, 
      gender, 
      blood_group, 
      allergies, 
      emergency_contact,
      height,
      birth_date,
      food_habit,
      current_medical_conditions
    )
    VALUES (
      p_user_id, 
      p_age, 
      p_gender, 
      p_blood_group, 
      p_allergies, 
      p_emergency_contact,
      p_height,
      p_birth_date,
      p_food_habit,
      p_current_medical_conditions
    )
    RETURNING to_json(patient_details.*) INTO v_result;
  END IF;
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions to the functions
GRANT EXECUTE ON FUNCTION create_user_role TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_role TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION create_patient_details TO anon, authenticated, service_role;

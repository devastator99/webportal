
-- Create a function to get the patient's care team
CREATE OR REPLACE FUNCTION public.get_patient_care_team(p_patient_id UUID)
RETURNS TABLE (
  role TEXT,
  first_name TEXT,
  last_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get the doctor from patient_assignments table
  RETURN QUERY
  SELECT 
    'doctor' as role,
    p.first_name,
    p.last_name
  FROM patient_assignments pa
  JOIN profiles p ON p.id = pa.doctor_id
  WHERE pa.patient_id = p_patient_id
  
  UNION ALL
  
  -- Get the nutritionist from patient_assignments table if assigned
  SELECT 
    'nutritionist' as role,
    p.first_name,
    p.last_name
  FROM patient_assignments pa
  JOIN profiles p ON p.id = pa.nutritionist_id
  WHERE pa.patient_id = p_patient_id AND pa.nutritionist_id IS NOT NULL;
  
END;
$$;

-- Create function to get appointments by date with improved security and patient info
CREATE OR REPLACE FUNCTION public.get_appointments_by_date(p_doctor_id UUID, p_date TEXT)
RETURNS TABLE (
  id UUID,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status appointment_status,
  patient_json JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.scheduled_at,
    a.status,
    jsonb_build_object(
      'id', p.id,
      'first_name', p.first_name,
      'last_name', p.last_name
    ) AS patient_json
  FROM 
    appointments a
  JOIN 
    profiles p ON a.patient_id = p.id
  WHERE 
    a.doctor_id = p_doctor_id
    AND TO_CHAR(a.scheduled_at, 'YYYY-MM-DD') = p_date
  ORDER BY 
    a.scheduled_at ASC;
END;
$$;

-- Create function to get count of upcoming appointments
CREATE OR REPLACE FUNCTION public.get_doctor_upcoming_appointments_count(doctor_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  upcoming_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO upcoming_count
  FROM appointments a
  WHERE a.doctor_id = $1
    AND a.status = 'scheduled'
    AND a.scheduled_at > (CURRENT_DATE + INTERVAL '1 day')::DATE;
    
  RETURN COALESCE(upcoming_count, 0);
END;
$$;

-- Create function to get count of today's appointments
CREATE OR REPLACE FUNCTION public.get_doctor_todays_appointments_count(doctor_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO today_count
  FROM appointments a
  WHERE a.doctor_id = $1
    AND a.status = 'scheduled'
    AND TO_CHAR(a.scheduled_at, 'YYYY-MM-DD') = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');
    
  RETURN COALESCE(today_count, 0);
END;
$$;

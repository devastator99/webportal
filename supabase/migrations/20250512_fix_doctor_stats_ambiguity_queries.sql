
-- Fix the get_doctor_patients_count function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION public.get_doctor_patients_count(doctor_id uuid)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM patient_assignments pa
    WHERE pa.doctor_id = $1
  );
END;
$$;

-- Fix the get_doctor_medical_records_count function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION public.get_doctor_medical_records_count(doctor_id uuid)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM medical_records mr
    WHERE mr.doctor_id = $1
  );
END;
$$;

-- Fix the get_doctor_todays_appointments_count function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION public.get_doctor_todays_appointments_count(doctor_id uuid)
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

-- Fix the get_doctor_upcoming_appointments_count function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION public.get_doctor_upcoming_appointments_count(doctor_id uuid)
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

-- Grant execute permissions to these functions
GRANT EXECUTE ON FUNCTION public.get_doctor_patients_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_medical_records_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_todays_appointments_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_upcoming_appointments_count(UUID) TO authenticated;

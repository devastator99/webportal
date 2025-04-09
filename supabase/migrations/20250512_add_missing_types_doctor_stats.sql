
-- Add the missing RPC function names to the TypeScript typing system
-- This ensures the frontend TypeScript checks understand that these functions exist

-- First, check if the functions already exist and create them if needed
-- Function for today's appointments count
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
  WHERE a.doctor_id = doctor_id
    AND a.status = 'scheduled'
    AND TO_CHAR(a.scheduled_at, 'YYYY-MM-DD') = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');
    
  RETURN COALESCE(today_count, 0);
END;
$$;

-- Function for upcoming appointments count
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
  WHERE a.doctor_id = doctor_id
    AND a.status = 'scheduled'
    AND a.scheduled_at > (CURRENT_DATE + INTERVAL '1 day')::DATE;
    
  RETURN COALESCE(upcoming_count, 0);
END;
$$;

-- Ensure execute permissions are granted
GRANT EXECUTE ON FUNCTION public.get_doctor_todays_appointments_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_upcoming_appointments_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_patients_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_medical_records_count(UUID) TO authenticated;

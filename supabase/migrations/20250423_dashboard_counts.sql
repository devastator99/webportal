
-- Create function to get count of doctor's today's appointments
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

-- Create function to get count of doctor's upcoming appointments
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

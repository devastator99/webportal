
-- Fix the data type mismatch in get_user_care_team_rooms function
CREATE OR REPLACE FUNCTION public.get_user_care_team_rooms(p_user_id UUID)
RETURNS TABLE(
  room_id UUID,
  room_name TEXT,
  room_description TEXT,
  room_type chat_room_type,
  created_at TIMESTAMP WITH TIME ZONE,
  patient_id UUID,
  patient_name TEXT,
  member_count INTEGER,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Get the user's role
  SELECT role::TEXT INTO v_user_role
  FROM user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
  
  RAISE NOTICE 'Fetching care team rooms for user % with role %', p_user_id, v_user_role;
  
  -- For doctors, show all care team rooms regardless of membership
  IF v_user_role = 'doctor' THEN
    RETURN QUERY
    SELECT 
      v.room_id,
      v.room_name,
      v.room_description,
      v.room_type,
      v.created_at,
      v.patient_id,
      v.patient_name,
      v.member_count,
      v.last_message,
      v.last_message_time
    FROM care_team_rooms_view v;
  ELSE
    -- For other users, only show rooms where they are members
    RETURN QUERY
    SELECT 
      v.room_id,
      v.room_name,
      v.room_description,
      v.room_type,
      v.created_at,
      v.patient_id,
      v.patient_name,
      v.member_count,
      v.last_message,
      v.last_message_time
    FROM care_team_rooms_view v
    JOIN room_members rm ON v.room_id = rm.room_id AND rm.user_id = p_user_id;
  END IF;
END;
$$;

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION public.get_user_care_team_rooms(UUID) TO authenticated;


-- Update the get_user_care_team_rooms function to properly handle doctor role and improve the query
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
  
  -- Main query to get all rooms where the user is a member
  RETURN QUERY
  WITH room_members_count AS (
    SELECT 
      rm.room_id,
      COUNT(*) as member_count
    FROM 
      room_members rm
    GROUP BY 
      rm.room_id
  ),
  last_messages AS (
    SELECT DISTINCT ON (msg.room_id)
      msg.room_id,
      msg.message,
      msg.created_at
    FROM 
      room_messages msg
    ORDER BY 
      msg.room_id, 
      msg.created_at DESC
  )
  SELECT 
    cr.id as room_id,
    cr.name as room_name,
    cr.description as room_description,
    cr.room_type,
    cr.created_at,
    cr.patient_id,
    COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '') as patient_name,
    COALESCE(rmc.member_count, 0) as member_count,
    lm.message as last_message,
    lm.created_at as last_message_time
  FROM 
    chat_rooms cr
  JOIN 
    room_members rm ON cr.id = rm.room_id AND rm.user_id = p_user_id
  LEFT JOIN 
    profiles p ON cr.patient_id = p.id
  LEFT JOIN
    room_members_count rmc ON cr.id = rmc.room_id
  LEFT JOIN
    last_messages lm ON cr.id = lm.room_id
  WHERE 
    cr.is_active = TRUE
  ORDER BY 
    lm.created_at DESC NULLS LAST,
    cr.created_at DESC;
END;
$$;

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION public.get_user_care_team_rooms(UUID) TO authenticated;

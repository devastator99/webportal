
-- Improve the get_care_team_messages function to properly include all messages and fix the order
CREATE OR REPLACE FUNCTION public.get_care_team_messages(
  p_user_id UUID,
  p_patient_id UUID,
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  message TEXT,
  message_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  read BOOLEAN,
  sender JSON,
  receiver JSON
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  care_team_ids UUID[];
BEGIN
  -- Get care team members for the patient (including the user)
  SELECT array_agg(id) INTO care_team_ids 
  FROM get_patient_care_team_members(p_patient_id);
  
  -- Add the current user's ID if not already in the care team
  IF NOT p_user_id = ANY(care_team_ids) THEN
    care_team_ids := array_append(care_team_ids, p_user_id);
  END IF;
  
  -- Add the patient ID if not already in the list
  IF NOT p_patient_id = ANY(care_team_ids) THEN
    care_team_ids := array_append(care_team_ids, p_patient_id);
  END IF;
  
  -- Return messages where both sender and receiver are in the care team
  -- including messages sent from or to the patient
  RETURN QUERY
  SELECT 
    cm.id,
    cm.message,
    cm.message_type::TEXT,
    cm.created_at,
    COALESCE(cm.read, FALSE) as read,
    json_build_object(
      'id', sender.id,
      'first_name', sender.first_name,
      'last_name', sender.last_name,
      'role', COALESCE(sender_role.role, 'patient')
    ) as sender,
    json_build_object(
      'id', receiver.id,
      'first_name', receiver.first_name,
      'last_name', receiver.last_name,
      'role', COALESCE(receiver_role.role, 'patient')
    ) as receiver
  FROM chat_messages cm
  JOIN profiles sender ON cm.sender_id = sender.id
  JOIN profiles receiver ON cm.receiver_id = receiver.id
  LEFT JOIN user_roles sender_role ON sender.id = sender_role.user_id
  LEFT JOIN user_roles receiver_role ON receiver.id = receiver_role.user_id
  WHERE (cm.sender_id = ANY(care_team_ids) AND cm.receiver_id = ANY(care_team_ids))
  ORDER BY cm.created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.get_care_team_messages TO authenticated;


-- Comment out the get_user_chat_messages function since it's not being used
-- We're keeping it in comments for potential future use

/*
CREATE OR REPLACE FUNCTION public.get_user_chat_messages(
  p_user_id UUID,
  p_other_user_id UUID,
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
BEGIN
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
  WHERE (cm.sender_id = p_user_id AND cm.receiver_id = p_other_user_id) OR 
        (cm.sender_id = p_other_user_id AND cm.receiver_id = p_user_id)
  ORDER BY cm.created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
*/

-- Now we also need to update the get-chat-messages edge function to remove the reference
-- to this function. Let's create a comment to remind us that we need to do this:

-- NOTE: The edge function at supabase/functions/get-chat-messages/index.ts should be
-- updated to remove the fallback to get_user_chat_messages. It should only use
-- get_care_team_messages for all messaging functionality.

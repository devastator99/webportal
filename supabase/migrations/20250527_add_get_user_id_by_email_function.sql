
-- Create a function to safely get user ID by email
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID from profiles table by matching email from auth.users
  SELECT p.id INTO user_id
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE au.email = user_email
  LIMIT 1;
  
  RETURN user_id;
END;
$function$;


-- This migration fixes the infinite recursion detected in the policy for user_roles
-- by creating a security definer function that can safely check roles without triggering recursion

-- First, create a function to check if a user has a specific role without using RLS
-- This avoids the infinite recursion by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.check_user_has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function runs with the security of the function owner,
  -- bypassing row level security policies
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = p_user_id 
    AND role = p_role::user_type
  );
END;
$$;

-- Create a function to check if the current user (auth.uid()) is an admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrator'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_user_has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin TO authenticated;

-- Update the sync-care-team-rooms function to use the new security definer function
CREATE OR REPLACE FUNCTION public.user_can_sync_rooms()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrator'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_can_sync_rooms TO authenticated;

-- The function sync_all_care_team_rooms can remain unchanged as it uses SECURITY DEFINER already



-- Update RLS policies to use the security definer functions instead of direct table access

-- Update the room_members table policies
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own rooms" ON public.room_members;
DROP POLICY IF EXISTS "Users can join rooms they're invited to" ON public.room_members;

-- Create policies using security definer function
CREATE POLICY "Users can view their own rooms" 
  ON public.room_members
  FOR SELECT
  USING (public.is_room_member(room_id, auth.uid()));

-- Update the room_messages table policies
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.room_messages;
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON public.room_messages;

-- Create policies using security definer function
CREATE POLICY "Users can view messages in their rooms" 
  ON public.room_messages
  FOR SELECT
  USING (public.is_room_member(room_id, auth.uid()));

CREATE POLICY "Users can send messages to their rooms" 
  ON public.room_messages
  FOR INSERT
  WITH CHECK (public.is_room_member(room_id, auth.uid()));

-- Also add policy for chat_rooms to use security definer
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view rooms they are members of" ON public.chat_rooms;

-- Create new policy with security definer
CREATE POLICY "Users can view rooms they are members of" 
  ON public.chat_rooms
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM room_members 
    WHERE room_id = id AND user_id = auth.uid()
  ));

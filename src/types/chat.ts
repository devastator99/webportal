
export interface RoomMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  is_system_message: boolean;
  is_ai_message: boolean;
  created_at: string;
  read_by: string[] | null;
  attachment?: {
    filename: string;
    url: string;
    size?: number;
    type?: string;
  } | null;
}

export interface TeamMember {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface CareTeamRoom {
  room_id: string;
  room_name: string;
  room_description: string;
  patient_id: string;
  patient_name: string;
  member_count: number;
  last_message: string;
  last_message_time: string;
  team_members?: TeamMember[];
}

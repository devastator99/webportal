
export interface RegistrationProgress {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  payment_status: string;
  care_team_assigned: boolean;
  chat_room_created: boolean;
  welcome_notification_sent: boolean;
  chatroom_notification_sent: boolean;
  registration_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DefaultCareTeam {
  id: string;
  default_doctor_id: string;
  default_nutritionist_id: string | null;
  is_active: boolean;
  created_at: string;
}

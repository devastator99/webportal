
import { UserRoleEnum } from "@/contexts/AuthContext";

export type AuthView = "sign_in" | "sign_up" | "magic_link" | "forgotten_password" | "update_password";

// Import UserRoleEnum directly from AuthContext instead of re-exporting
export { UserRoleEnum };

// Define UserRole type (get it from AuthContext)
export type UserRole = 'patient' | 'doctor' | 'nutritionist' | 'administrator' | 'reception' | null;

// Add string literals for system roles not included in UserRole
export type SystemRole = "aibot" | "system";

// Combined type for all possible roles
export type AnyRole = UserRole | SystemRole;

// Add type definition for the get_room_messages RPC function parameters
export interface GetRoomMessagesParams {
  p_room_id: string;
  p_limit?: number;
  p_offset?: number;
  p_user_role?: string;
}

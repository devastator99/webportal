
import { UserRole } from "@/contexts/AuthContext";

export type AuthView = "sign_in" | "sign_up" | "magic_link" | "forgotten_password" | "update_password";

// Re-export the UserRole type using proper TypeScript syntax
export type { UserRole };

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

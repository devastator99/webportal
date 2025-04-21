
import { UserRole } from "@/contexts/AuthContext";

export type AuthView = "sign_in" | "sign_up" | "magic_link" | "forgotten_password" | "update_password";

// Re-export the UserRole type using proper TypeScript syntax
export type { UserRole };

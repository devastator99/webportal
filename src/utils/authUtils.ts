
import { supabase } from "@/integrations/supabase/client";

export const forceSignOut = async () => {
  console.log("[AuthUtils] Starting force sign out process");
  
  try {
    // First attempt to sign out via Supabase
    await supabase.auth.signOut();
    console.log("[AuthUtils] Supabase sign out successful");
  } catch (error) {
    console.error("[AuthUtils] Supabase sign out failed:", error);
  } finally {
    // Clear all storage regardless of Supabase success/failure
    console.log("[AuthUtils] Clearing all storage");
    localStorage.clear();
    sessionStorage.clear();
    
    // Force reload the page to clear any remaining state
    console.log("[AuthUtils] Reloading page");
    window.location.href = "/";
  }
};

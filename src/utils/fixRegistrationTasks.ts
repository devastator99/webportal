
// Utility function to fix registration tasks that were completed but not marked as such
import { supabase } from "@/integrations/supabase/client";

export const fixRegistrationTasksForUser = async (userId: string) => {
  try {
    console.log("=== FIXING REGISTRATION TASKS ===");
    console.log("User ID:", userId);
    
    // Check if the user has a chat room created
    const { data: chatRooms, error: chatRoomError } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('patient_id', userId)
      .eq('room_type', 'care_team');
    
    if (chatRoomError) {
      console.error("Error checking chat rooms:", chatRoomError);
      return { success: false, error: chatRoomError.message };
    }
    
    console.log("Found chat rooms:", chatRooms);
    
    // If chat room exists, mark the create_chat_room task as completed
    if (chatRooms && chatRooms.length > 0) {
      console.log("Chat room exists, updating task status...");
      
      // Update the task status using RPC function
      const { error: updateError } = await supabase.rpc('update_registration_task_status', {
        p_task_id: null, // We'll update by user_id and task_type
        p_status: 'completed',
        p_result_payload: { room_id: chatRooms[0].id, fixed_manually: true }
      });
      
      if (updateError) {
        console.error("Error updating task status:", updateError);
        
        // Try direct update as fallback
        const { error: directUpdateError } = await supabase
          .from('registration_tasks')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString(),
            result_payload: { room_id: chatRooms[0].id, fixed_manually: true }
          })
          .eq('user_id', userId)
          .eq('task_type', 'create_chat_room')
          .eq('status', 'pending');
        
        if (directUpdateError) {
          console.error("Direct update also failed:", directUpdateError);
          return { success: false, error: directUpdateError.message };
        } else {
          console.log("Direct update succeeded");
        }
      } else {
        console.log("RPC update succeeded");
      }
    }
    
    return { success: true, message: "Registration tasks fixed successfully" };
  } catch (error: any) {
    console.error("Exception fixing registration tasks:", error);
    return { success: false, error: error.message };
  }
};

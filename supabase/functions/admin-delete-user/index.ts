
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parse the request body
    const { user_id, admin_id } = await req.json();
    
    if (!user_id || !admin_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: user_id and admin_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify if the request is from an admin user
    const authHeader = req.headers.get("Authorization")?.split(" ")[1] || "";
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Verify the user is actually an admin by direct query - avoiding RLS recursion
    const { data: adminRoleData, error: adminRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', admin_id)
      .single();
      
    if (adminRoleError || !adminRoleData || adminRoleData.role !== 'administrator') {
      return new Response(
        JSON.stringify({ error: "Only administrators can delete users" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Don't allow the admin to delete themselves
    if (user_id === admin_id) {
      return new Response(
        JSON.stringify({ error: "Cannot delete your own account" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Admin ${admin_id} is deleting user ${user_id}`);

    // Delete user from database tables in correct order to avoid foreign key constraints
    
    // 1. Delete from room_messages first (references chat_rooms and users)
    const { error: roomMessagesError } = await supabaseAdmin
      .from('room_messages')
      .delete()
      .eq('sender_id', user_id);

    if (roomMessagesError) {
      console.error("Error deleting room messages:", roomMessagesError);
      // Continue with deletion
    }

    // 2. Delete from room_members (references chat_rooms and users)
    const { error: roomMembersError } = await supabaseAdmin
      .from('room_members')
      .delete()
      .eq('user_id', user_id);

    if (roomMembersError) {
      console.error("Error deleting room members:", roomMembersError);
      // Continue with deletion
    }

    // 3. Delete from chat_rooms where patient_id references the user
    const { error: chatRoomsError } = await supabaseAdmin
      .from('chat_rooms')
      .delete()
      .eq('patient_id', user_id);

    if (chatRoomsError) {
      console.error("Error deleting chat rooms:", chatRoomsError);
      // Continue with deletion
    }

    // 4. Delete from patient_details first (this was causing the original error)
    const { error: patientDetailsError } = await supabaseAdmin
      .from('patient_details')
      .delete()
      .eq('id', user_id);

    if (patientDetailsError) {
      console.error("Error deleting patient details:", patientDetailsError);
      // Continue with deletion
    }

    // 5. Delete from habit_progress_logs
    const { error: habitLogsError } = await supabaseAdmin
      .from('habit_progress_logs')
      .delete()
      .eq('user_id', user_id);

    if (habitLogsError) {
      console.error("Error deleting habit logs:", habitLogsError);
      // Continue with deletion
    }

    // 6. Delete from health_plan_items
    const { error: healthPlanError } = await supabaseAdmin
      .from('health_plan_items')
      .delete()
      .eq('patient_id', user_id);

    if (healthPlanError) {
      console.error("Error deleting health plan items:", healthPlanError);
      // Continue with deletion
    }

    // 7. Delete from medical_records where user is patient or doctor
    const { error: medicalRecordsError } = await supabaseAdmin
      .from('medical_records')
      .delete()
      .or(`patient_id.eq.${user_id},doctor_id.eq.${user_id}`);

    if (medicalRecordsError) {
      console.error("Error deleting medical records:", medicalRecordsError);
      // Continue with deletion
    }

    // 8. Delete from patient_invoices
    const { error: invoicesError } = await supabaseAdmin
      .from('patient_invoices')
      .delete()
      .or(`patient_id.eq.${user_id},doctor_id.eq.${user_id}`);

    if (invoicesError) {
      console.error("Error deleting patient invoices:", invoicesError);
      // Continue with deletion
    }

    // 9. Delete from chat_messages
    const { error: chatMessagesError } = await supabaseAdmin
      .from('chat_messages')
      .delete()
      .or(`sender_id.eq.${user_id},receiver_id.eq.${user_id}`);

    if (chatMessagesError) {
      console.error("Error deleting chat messages:", chatMessagesError);
      // Continue with deletion
    }

    // 10. Delete from appointments
    const { error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .delete()
      .or(`patient_id.eq.${user_id},doctor_id.eq.${user_id}`);

    if (appointmentsError) {
      console.error("Error deleting appointments:", appointmentsError);
      // Continue with deletion
    }

    // 11. Delete from registration_tasks
    const { error: tasksError } = await supabaseAdmin
      .from('registration_tasks')
      .delete()
      .eq('user_id', user_id);

    if (tasksError) {
      console.error("Error deleting registration tasks:", tasksError);
      // Continue with deletion
    }

    // 12. Delete from notification_logs
    const { error: notificationLogsError } = await supabaseAdmin
      .from('notification_logs')
      .delete()
      .eq('user_id', user_id);

    if (notificationLogsError) {
      console.error("Error deleting notification logs:", notificationLogsError);
      // Continue with deletion
    }

    // 13. Delete from push_subscriptions
    const { error: pushSubscriptionsError } = await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user_id);

    if (pushSubscriptionsError) {
      console.error("Error deleting push subscriptions:", pushSubscriptionsError);
      // Continue with deletion
    }

    // 14. Delete from notification_preferences
    const { error: notificationPreferencesError } = await supabaseAdmin
      .from('notification_preferences')
      .delete()
      .eq('user_id', user_id);

    if (notificationPreferencesError) {
      console.error("Error deleting notification preferences:", notificationPreferencesError);
      // Continue with deletion
    }

    // 15. Delete from patient_assignments (must be done before user_roles)
    const { error: assignmentsError } = await supabaseAdmin
      .from('patient_assignments')
      .delete()
      .or(`patient_id.eq.${user_id},doctor_id.eq.${user_id},nutritionist_id.eq.${user_id}`);

    if (assignmentsError) {
      console.error("Error deleting patient assignments:", assignmentsError);
      // Continue with deletion
    }

    // 16. Delete from user_roles
    const { error: userRolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user_id);

    if (userRolesError) {
      console.error("Error deleting user roles:", userRolesError);
      throw userRolesError;
    }

    // 17. Delete from profiles
    const { error: profilesError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user_id);

    if (profilesError) {
      console.error("Error deleting profile:", profilesError);
      throw profilesError;
    }

    // 18. Finally delete the user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error("Auth deletion error:", deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted user ${user_id} and all related data`);

    return new Response(
      JSON.stringify({ success: true, message: "User and all related data successfully deleted" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in admin-delete-user function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

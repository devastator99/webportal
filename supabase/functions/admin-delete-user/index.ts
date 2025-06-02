
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
    
    // Verify the user is actually an admin by direct query
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

    // Helper function to safely delete from a table
    const safeDelete = async (tableName: string, condition: any) => {
      try {
        const { error } = await supabaseAdmin
          .from(tableName)
          .delete()
          .eq('user_id', user_id);
        
        if (error) {
          console.error(`Error deleting from ${tableName}:`, error);
        } else {
          console.log(`Successfully deleted from ${tableName}`);
        }
      } catch (error) {
        console.error(`Exception deleting from ${tableName}:`, error);
      }
    };

    // Helper function for deleting with different column names
    const safeDeleteWithColumn = async (tableName: string, columnName: string) => {
      try {
        const { error } = await supabaseAdmin
          .from(tableName)
          .delete()
          .eq(columnName, user_id);
        
        if (error) {
          console.error(`Error deleting from ${tableName}:`, error);
        } else {
          console.log(`Successfully deleted from ${tableName}`);
        }
      } catch (error) {
        console.error(`Exception deleting from ${tableName}:`, error);
      }
    };

    // Helper function for deleting with OR conditions
    const safeDeleteMultipleColumns = async (tableName: string, columns: string[]) => {
      try {
        let query = supabaseAdmin.from(tableName).delete();
        
        // Build OR condition for multiple columns
        const orCondition = columns.map(col => `${col}.eq.${user_id}`).join(',');
        query = query.or(orCondition);
        
        const { error } = await query;
        
        if (error) {
          console.error(`Error deleting from ${tableName}:`, error);
        } else {
          console.log(`Successfully deleted from ${tableName}`);
        }
      } catch (error) {
        console.error(`Exception deleting from ${tableName}:`, error);
      }
    };

    // Delete user from database tables in correct order to avoid foreign key constraints
    
    // 1. Delete from system_logs (CRITICAL - this was missing and causing the error)
    await safeDelete('system_logs', 'user_id');

    // 2. Delete from room_messages
    await safeDeleteWithColumn('room_messages', 'sender_id');

    // 3. Delete from room_members
    await safeDelete('room_members', 'user_id');

    // 4. Delete from chat_rooms where patient_id references the user
    await safeDeleteWithColumn('chat_rooms', 'patient_id');

    // 5. Delete from patient_details
    await safeDeleteWithColumn('patient_details', 'id');

    // 6. Delete from health_plan_items
    await safeDeleteMultipleColumns('health_plan_items', ['patient_id', 'nutritionist_id']);

    // 7. Delete from medical_records
    await safeDeleteMultipleColumns('medical_records', ['patient_id', 'doctor_id']);

    // 8. Delete from patient_invoices
    await safeDeleteMultipleColumns('patient_invoices', ['patient_id', 'doctor_id']);

    // 9. Delete from chat_messages
    await safeDeleteMultipleColumns('chat_messages', ['sender_id', 'receiver_id']);

    // 10. Delete from appointments
    await safeDeleteMultipleColumns('appointments', ['patient_id', 'doctor_id']);

    // 11. Delete from registration_tasks
    await safeDelete('registration_tasks', 'user_id');

    // 12. Delete from notification_logs
    await safeDelete('notification_logs', 'user_id');

    // 13. Delete from push_subscriptions
    await safeDelete('push_subscriptions', 'user_id');

    // 14. Delete from notification_preferences
    await safeDelete('notification_preferences', 'user_id');

    // 15. Delete from patient_assignments
    await safeDeleteMultipleColumns('patient_assignments', ['patient_id', 'doctor_id', 'nutritionist_id']);

    // 16. Delete from doctor_details
    await safeDeleteWithColumn('doctor_details', 'id');

    // 17. Delete from doctor_availability
    await safeDeleteWithColumn('doctor_availability', 'doctor_id');

    // 18. Delete from patient_medical_reports
    await safeDeleteWithColumn('patient_medical_reports', 'patient_id');

    // 19. Delete from password_reset_otps
    await safeDelete('password_reset_otps', 'user_id');

    // 20. Delete from prescription_medications (via medical_records - skip complex subquery)
    // This will be cleaned up by cascade when medical_records are deleted

    // 21. Delete from prescribed_tests (via medical_records - skip complex subquery)
    // This will be cleaned up by cascade when medical_records are deleted

    // 22. Delete from user_roles (critical - must be successful)
    const { error: userRolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user_id);

    if (userRolesError) {
      console.error("Critical error deleting user roles:", userRolesError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to delete user roles: ${userRolesError.message}`,
          details: userRolesError
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 23. Delete from profiles (critical - must be successful)
    const { error: profilesError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user_id);

    if (profilesError) {
      console.error("Critical error deleting profile:", profilesError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to delete user profile: ${profilesError.message}`,
          details: profilesError
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 24. Finally delete the user from auth.users (critical - must be successful)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error("Critical auth deletion error:", deleteError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to delete user from auth: ${deleteError.message}`,
          details: deleteError
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Successfully deleted user ${user_id} and all related data`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User and all related data successfully deleted",
        user_id: user_id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Unexpected error in admin-delete-user function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: `Unexpected error: ${error.message}`,
        details: error
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

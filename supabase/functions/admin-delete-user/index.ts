
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
    const safeDelete = async (tableName: string, columnName: string = 'user_id') => {
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

    // Helper function for complex deletions with proper subqueries
    const deleteWithSubquery = async (tableName: string, columnName: string, subqueryTable: string, subqueryColumn: string) => {
      try {
        // First get the IDs to delete
        const { data: idsToDelete, error: selectError } = await supabaseAdmin
          .from(subqueryTable)
          .select('id')
          .or(`patient_id.eq.${user_id},doctor_id.eq.${user_id}`);

        if (selectError) {
          console.error(`Error selecting IDs for ${tableName}:`, selectError);
          return;
        }

        if (idsToDelete && idsToDelete.length > 0) {
          const ids = idsToDelete.map(item => item.id);
          const { error: deleteError } = await supabaseAdmin
            .from(tableName)
            .delete()
            .in(columnName, ids);

          if (deleteError) {
            console.error(`Error deleting from ${tableName}:`, deleteError);
          } else {
            console.log(`Successfully deleted from ${tableName}`);
          }
        }
      } catch (error) {
        console.error(`Exception deleting from ${tableName}:`, error);
      }
    };

    // Delete user from database tables in correct order to avoid foreign key constraints
    
    // 1. Delete from system_logs (CRITICAL - this was missing and causing the error)
    await safeDelete('system_logs');

    // 2. Delete from room_messages
    await safeDelete('room_messages', 'sender_id');

    // 3. Delete from room_members
    await safeDelete('room_members');

    // 4. Delete from chat_rooms where patient_id references the user
    await safeDelete('chat_rooms', 'patient_id');

    // 5. Delete from patient_details
    await safeDelete('patient_details', 'id');

    // 6. Delete from health_plan_items - check both patient_id and nutritionist_id
    await safeDelete('health_plan_items', 'patient_id');
    await safeDelete('health_plan_items', 'nutritionist_id');

    // 7. Delete prescription medications and tests (using proper subquery approach)
    await deleteWithSubquery('prescription_medications', 'prescription_id', 'medical_records', 'id');
    await deleteWithSubquery('prescribed_tests', 'prescription_id', 'medical_records', 'id');

    // 8. Delete from medical_records
    await safeDelete('medical_records', 'patient_id');
    await safeDelete('medical_records', 'doctor_id');

    // 9. Delete from patient_invoices
    await safeDelete('patient_invoices', 'patient_id');
    await safeDelete('patient_invoices', 'doctor_id');

    // 10. Delete from chat_messages
    await safeDelete('chat_messages', 'sender_id');
    await safeDelete('chat_messages', 'receiver_id');

    // 11. Delete appointments properly
    await safeDelete('appointments', 'patient_id');
    await safeDelete('appointments', 'doctor_id');

    // 12. Delete from payments (using proper subquery approach)
    await deleteWithSubquery('payments', 'appointment_id', 'appointments', 'id');

    // 13. Delete from registration_tasks
    await safeDelete('registration_tasks');

    // 14. Delete from notification_logs
    await safeDelete('notification_logs');

    // 15. Delete from push_subscriptions
    await safeDelete('push_subscriptions');

    // 16. Delete from notification_preferences
    await safeDelete('notification_preferences');

    // 17. Delete from patient_assignments
    await safeDelete('patient_assignments', 'patient_id');
    await safeDelete('patient_assignments', 'doctor_id');
    await safeDelete('patient_assignments', 'nutritionist_id');

    // 18. Delete from doctor_details
    await safeDelete('doctor_details', 'id');

    // 19. Delete from doctor_availability
    await safeDelete('doctor_availability', 'doctor_id');

    // 20. Delete from patient_medical_reports
    await safeDelete('patient_medical_reports', 'patient_id');

    // 21. Delete from password_reset_otps
    await safeDelete('password_reset_otps');

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


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
        JSON.stringify({ 
          error: "Missing required parameters: user_id and admin_id are required",
          success: false
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Admin ${admin_id} attempting to delete user ${user_id}`);

    // Verify the admin has the administrator role using direct query
    const { data: adminRoleData, error: adminRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', admin_id)
      .single();
      
    if (adminRoleError || !adminRoleData || adminRoleData.role !== 'administrator') {
      console.error("Admin role verification failed:", adminRoleError);
      return new Response(
        JSON.stringify({ 
          error: "Only administrators can delete users",
          success: false
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Don't allow the admin to delete themselves
    if (user_id === admin_id) {
      return new Response(
        JSON.stringify({ 
          error: "Cannot delete your own account",
          success: false
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Admin role verified. Proceeding with deletion of user ${user_id}`);

    // Helper function to safely delete from a table
    const safeDelete = async (tableName: string, columnName: string = 'user_id') => {
      try {
        console.log(`Deleting from ${tableName} where ${columnName} = ${user_id}`);
        const { error } = await supabaseAdmin
          .from(tableName)
          .delete()
          .eq(columnName, user_id);
        
        if (error) {
          console.error(`Error deleting from ${tableName}:`, error);
          return false;
        } else {
          console.log(`Successfully deleted from ${tableName}`);
          return true;
        }
      } catch (error) {
        console.error(`Exception deleting from ${tableName}:`, error);
        return false;
      }
    };

    // Delete user from database tables in correct order to avoid foreign key constraints
    const deletionSteps = [
      { table: 'system_logs', column: 'user_id' },
      { table: 'room_messages', column: 'sender_id' },
      { table: 'room_members', column: 'user_id' },
      { table: 'chat_rooms', column: 'patient_id' },
      { table: 'patient_details', column: 'id' },
      { table: 'health_plan_items', column: 'patient_id' },
      { table: 'health_plan_items', column: 'nutritionist_id' },
      { table: 'medical_records', column: 'patient_id' },
      { table: 'medical_records', column: 'doctor_id' },
      { table: 'patient_invoices', column: 'patient_id' },
      { table: 'patient_invoices', column: 'doctor_id' },
      { table: 'chat_messages', column: 'sender_id' },
      { table: 'chat_messages', column: 'receiver_id' },
      { table: 'appointments', column: 'patient_id' },
      { table: 'appointments', column: 'doctor_id' },
      { table: 'registration_tasks', column: 'user_id' },
      { table: 'notification_logs', column: 'user_id' },
      { table: 'push_subscriptions', column: 'user_id' },
      { table: 'notification_preferences', column: 'user_id' },
      { table: 'patient_assignments', column: 'patient_id' },
      { table: 'patient_assignments', column: 'doctor_id' },
      { table: 'patient_assignments', column: 'nutritionist_id' },
      { table: 'doctor_details', column: 'id' },
      { table: 'doctor_availability', column: 'doctor_id' },
      { table: 'patient_medical_reports', column: 'patient_id' },
      { table: 'password_reset_otps', column: 'user_id' },
    ];

    // Execute deletions
    let failedDeletions = [];
    for (const step of deletionSteps) {
      const success = await safeDelete(step.table, step.column);
      if (!success) {
        failedDeletions.push(`${step.table}.${step.column}`);
      }
    }

    // Delete from user_roles (critical)
    const { error: userRolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user_id);

    if (userRolesError) {
      console.error("Critical error deleting user roles:", userRolesError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to delete user roles: ${userRolesError.message}`,
          details: userRolesError,
          success: false
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Delete from profiles (critical)
    const { error: profilesError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user_id);

    if (profilesError) {
      console.error("Critical error deleting profile:", profilesError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to delete user profile: ${profilesError.message}`,
          details: profilesError,
          success: false
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Finally delete the user from auth.users (critical)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error("Critical auth deletion error:", deleteError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to delete user from auth: ${deleteError.message}`,
          details: deleteError,
          success: false
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
        user_id: user_id,
        failed_deletions: failedDeletions.length > 0 ? failedDeletions : null
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
        details: error,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

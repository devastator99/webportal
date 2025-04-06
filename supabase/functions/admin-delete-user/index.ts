
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

    // Delete user from database tables directly instead of using RPC
    // Delete from user_roles first
    const { error: userRolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user_id);

    if (userRolesError) {
      console.error("Error deleting user roles:", userRolesError);
      throw userRolesError;
    }

    // Delete from patient_assignments if exists
    const { error: assignmentsError } = await supabaseAdmin
      .from('patient_assignments')
      .delete()
      .or(`patient_id.eq.${user_id},doctor_id.eq.${user_id},nutritionist_id.eq.${user_id}`);

    if (assignmentsError) {
      console.error("Error deleting patient assignments:", assignmentsError);
      // Continue with deletion even if this fails
    }

    // Delete from profiles
    const { error: profilesError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user_id);

    if (profilesError) {
      console.error("Error deleting profile:", profilesError);
      throw profilesError;
    }

    // Finally delete the user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error("Auth deletion error:", deleteError);
      throw deleteError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "User successfully deleted" }),
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

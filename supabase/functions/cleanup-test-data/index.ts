
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

    const { confirmCleanup, testDataOnly } = await req.json();
    
    if (!confirmCleanup) {
      return new Response(
        JSON.stringify({ error: "Cleanup confirmation required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Starting test data cleanup...");

    // Get all users that are marked as test users or have test emails
    const { data: testUsers, error: getUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (getUsersError) {
      throw getUsersError;
    }

    const testUserIds = testUsers.users
      .filter(user => 
        user.email?.includes('test') || 
        user.email?.includes('demo') ||
        user.email?.includes('example') ||
        user.user_metadata?.test_user === true
      )
      .map(user => user.id);

    console.log(`Found ${testUserIds.length} test users to clean up`);

    let deletedCounts = {
      users: 0,
      profiles: 0,
      otps: 0,
      messages: 0
    };

    // Delete related data for each test user
    for (const userId of testUserIds) {
      console.log(`Cleaning up data for user: ${userId}`);

      // Delete from registration_tasks
      await supabaseAdmin
        .from('registration_tasks')
        .delete()
        .eq('user_id', userId);

      // Delete from patient_assignments
      await supabaseAdmin
        .from('patient_assignments')
        .delete()
        .or(`patient_id.eq.${userId},doctor_id.eq.${userId},nutritionist_id.eq.${userId}`);

      // Delete from user_roles
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Delete from patient_details
      await supabaseAdmin
        .from('patient_details')
        .delete()
        .eq('id', userId);

      // Delete from doctor_details
      await supabaseAdmin
        .from('doctor_details')
        .delete()
        .eq('id', userId);

      // Delete from profiles
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (!profileError) {
        deletedCounts.profiles++;
      }

      // Delete from chat_messages
      const { data: messagesData } = await supabaseAdmin
        .from('chat_messages')
        .delete()
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .select('id');

      deletedCounts.messages += messagesData?.length || 0;

      // Delete other related data
      await supabaseAdmin.from('room_members').delete().eq('user_id', userId);
      await supabaseAdmin.from('patient_invoices').delete().or(`patient_id.eq.${userId},doctor_id.eq.${userId}`);
      await supabaseAdmin.from('medical_records').delete().or(`patient_id.eq.${userId},doctor_id.eq.${userId}`);
      await supabaseAdmin.from('health_plan_items').delete().or(`patient_id.eq.${userId},nutritionist_id.eq.${userId}`);
      await supabaseAdmin.from('notification_logs').delete().eq('user_id', userId);
      await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', userId);
      await supabaseAdmin.from('notification_preferences').delete().eq('user_id', userId);
      await supabaseAdmin.from('appointments').delete().or(`patient_id.eq.${userId},doctor_id.eq.${userId}`);
      await supabaseAdmin.from('doctor_availability').delete().eq('doctor_id', userId);
      await supabaseAdmin.from('educational_resources').delete().eq('uploaded_by', userId);
      await supabaseAdmin.from('knowledge_videos').delete().eq('uploaded_by', userId);
      await supabaseAdmin.from('patient_medical_reports').delete().eq('patient_id', userId);

      // Finally delete the user from auth.users
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (!deleteError) {
        deletedCounts.users++;
      } else {
        console.error(`Failed to delete user ${userId}:`, deleteError);
      }
    }

    // Clean up orphaned OTPs
    const { data: otpData } = await supabaseAdmin
      .from('password_reset_otps')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    deletedCounts.otps = otpData?.length || 0;

    console.log('Test data cleanup completed', deletedCounts);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Test data cleanup completed successfully",
        summary: deletedCounts
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in cleanup-test-data function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

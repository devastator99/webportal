
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roomId } = await req.json();
    
    if (!roomId) {
      return new Response(
        JSON.stringify({ error: "Room ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with auth context
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
      
    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Could not verify user role", details: roleError?.message }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if user is doctor or nutritionist
    if (!['doctor', 'nutritionist'].includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: "Only doctors and nutritionists can generate summaries" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if user is member of the room
    const { data: memberData, error: memberError } = await supabaseClient
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();
      
    if (memberError || !memberData) {
      return new Response(
        JSON.stringify({ error: "You are not a member of this room" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert a system message about the summary
    const { data: messageData, error: messageError } = await supabaseClient
      .from('room_messages')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        message: 'Requested a summary of the conversation',
        is_system_message: true,
        read_by: [user.id]
      })
      .select('id')
      .single();
    
    if (messageError) {
      return new Response(
        JSON.stringify({ error: "Error creating system message", details: messageError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // In a real implementation, you would call an AI service here to generate the summary
    // For now, just return success
    
    return new Response(
      JSON.stringify({ success: true, message: "Summary generation initiated" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in generate-chat-summary:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

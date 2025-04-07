
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, other_user_id, page = 1, per_page = 50 } = await req.json();
    
    if (!user_id || !other_user_id) {
      return new Response(
        JSON.stringify({ error: "User ID and other user ID are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with the auth context of the request
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );
    
    // Calculate pagination
    const pageNumber = parseInt(String(page));
    const perPage = parseInt(String(per_page));
    const offset = (pageNumber - 1) * perPage;
    
    console.log("Fetching messages for user:", user_id, "and other user:", other_user_id);
    
    // First, get the user's role to help with debugging
    const { data: userRoleData, error: userRoleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .single();
      
    if (userRoleError) {
      console.error("Error fetching user role:", userRoleError);
    } else {
      console.log("User role:", userRoleData?.role || "unknown");
    }
    
    // First, check if get_care_team_messages_count exists
    try {
      console.log("Getting count of messages");
      const { data: count, error: countError } = await supabaseClient.rpc('get_care_team_messages_count', {
        p_user_id: user_id,
        p_patient_id: other_user_id
      });
      
      if (countError) {
        console.error("Error getting message count:", countError);
        throw countError;
      }
      
      // Use the get_care_team_messages RPC function
      console.log("Using get_care_team_messages RPC function");
      const { data: messages, error: messagesError } = await supabaseClient.rpc('get_care_team_messages', {
        p_user_id: user_id,
        p_patient_id: other_user_id,
        p_offset: offset,
        p_limit: perPage
      });
      
      if (messagesError) {
        console.error("Error fetching care team messages:", messagesError);
        throw messagesError;
      }
      
      console.log(`Retrieved ${messages?.length || 0} messages out of ${count || 0} total`);
      
      // Determine if there are more messages
      const hasMore = count != null && count > offset + (messages?.length || 0);
      
      return new Response(
        JSON.stringify({
          messages: messages || [],
          hasMore,
          totalCount: count,
          page: pageNumber,
          perPage
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (fnError) {
      console.error("Error with RPC function:", fnError);
      
      // Get the care team members for debugging
      const { data: careTeam, error: careTeamError } = await supabaseClient
        .rpc('get_patient_care_team_members', { p_patient_id: other_user_id });
        
      if (careTeamError) {
        console.error("Error fetching care team members:", careTeamError);
      } else {
        console.log("Care team members:", careTeam);
      }
      
      // Fallback to direct querying if RPC functions fail
      console.log("Falling back to direct message querying");
      const { data: directMessages, error: directError } = await supabaseClient
        .from('chat_messages')
        .select(`
          id,
          message,
          message_type,
          created_at,
          read,
          sender:sender_id(id, first_name, last_name, user_roles!inner(role)),
          receiver:receiver_id(id, first_name, last_name, user_roles!inner(role))
        `)
        .or(`sender_id.eq.${user_id},receiver_id.eq.${user_id}`)
        .or(`sender_id.eq.${other_user_id},receiver_id.eq.${other_user_id}`)
        .order('created_at', { ascending: true })
        .range(offset, offset + perPage - 1);
      
      if (directError) {
        console.error("Error in fallback query:", directError);
        throw directError;
      }
      
      console.log(`Retrieved ${directMessages?.length || 0} messages using fallback method`);
      
      return new Response(
        JSON.stringify({
          messages: directMessages || [],
          hasMore: false, // Cannot determine with this method
          totalCount: directMessages?.length || 0,
          page: pageNumber,
          perPage
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
  } catch (error) {
    console.error("Exception in get-chat-messages:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

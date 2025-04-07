
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
    
    // Get the roles of both users to determine context
    const { data: otherUserData, error: otherUserError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', other_user_id)
      .single();
      
    const { data: userRoleData, error: userRoleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .single();
    
    const userRole = userRoleData?.role || "unknown";
    const otherUserRole = otherUserData?.role || "unknown";
    console.log("User role:", userRole, "Other user role:", otherUserRole);
    
    let isPatientCareTeamChat = false;
    let patientId = null;
    
    // Determine if this is a patient care team chat
    if (otherUserRole === 'patient') {
      // If other user is a patient, we're in a care team chat for this patient
      isPatientCareTeamChat = true;
      patientId = other_user_id;
    } else if (userRole === 'patient') {
      // If current user is a patient, we're in a care team chat for this patient
      isPatientCareTeamChat = true;
      patientId = user_id;
    }
    
    try {
      if (isPatientCareTeamChat && patientId) {
        console.log("Getting care team messages for patient:", patientId);
        
        // Count the total number of messages in the care team
        const { data: count, error: countError } = await supabaseClient.rpc('get_care_team_messages_count', {
          p_user_id: user_id,
          p_patient_id: patientId
        });
        
        if (countError) {
          console.error("Error getting message count:", countError);
          throw countError;
        }
        
        // Use the get_care_team_messages RPC function with the patient ID
        console.log("Using get_care_team_messages RPC function");
        const { data: messages, error: messagesError } = await supabaseClient.rpc('get_care_team_messages', {
          p_user_id: user_id,
          p_patient_id: patientId,
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
      } else {
        // Regular one-to-one chat
        console.log("Getting direct messages between:", user_id, "and", other_user_id);
        
        // Use the get_user_chat_messages RPC function for direct messages
        const { data: directCount } = await supabaseClient
          .from('chat_messages')
          .count()
          .or(`sender_id.eq.${user_id},receiver_id.eq.${user_id}`)
          .or(`sender_id.eq.${other_user_id},receiver_id.eq.${other_user_id}`);
        
        const count = directCount && directCount[0] ? parseInt(directCount[0].count) : 0;
        
        const { data: directMessages, error: directError } = await supabaseClient
          .rpc('get_user_chat_messages', {
            p_user_id: user_id,
            p_other_user_id: other_user_id,
            p_offset: offset,
            p_limit: perPage
          });
        
        if (directError) {
          console.error("Error getting direct messages:", directError);
          throw directError;
        }
        
        console.log(`Retrieved ${directMessages?.length || 0} direct messages`);
        
        const hasMore = count > offset + (directMessages?.length || 0);
        
        return new Response(
          JSON.stringify({
            messages: directMessages || [],
            hasMore,
            totalCount: count,
            page: pageNumber,
            perPage
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (fnError) {
      console.error("Error in primary message function:", fnError);
      
      // Enhanced fallback with improved logging
      console.log("Falling back to direct message querying");
      
      // Try to get the care team members for this patient for debugging
      if (patientId) {
        const { data: careTeam, error: careTeamError } = await supabaseClient
          .rpc('get_patient_care_team_members', { p_patient_id: patientId });
          
        if (careTeamError) {
          console.error("Error fetching care team members:", careTeamError);
        } else {
          console.log("Care team members:", careTeam);
        }
      }
      
      // Fallback query that tries to get all messages the user should see
      let query = supabaseClient
        .from('chat_messages')
        .select(`
          id,
          message,
          message_type,
          created_at,
          read,
          sender:sender_id(id, first_name, last_name, user_roles!inner(role)),
          receiver:receiver_id(id, first_name, last_name, user_roles!inner(role))
        `);
        
      if (patientId) {
        // For care team chat, get messages involving the patient and the care team
        const { data: careTeam } = await supabaseClient
          .rpc('get_patient_care_team_members', { p_patient_id: patientId });
          
        if (careTeam && Array.isArray(careTeam) && careTeam.length > 0) {
          // Extract just the IDs from the care team
          const careTeamIds = careTeam.map(member => member.id);
          
          // Add the patient ID and current user ID
          const relevantIds = [...careTeamIds, patientId, user_id];
          const uniqueIds = [...new Set(relevantIds)].filter(id => id);
          
          // Build a more comprehensive filter for care team chat
          query = query
            .or(uniqueIds.map(id => `sender_id.eq.${id}`).join(','))
            .or(uniqueIds.map(id => `receiver_id.eq.${id}`).join(','));
        } else {
          // If can't get care team, fall back to patient + current user
          query = query
            .or(`sender_id.eq.${patientId},receiver_id.eq.${patientId}`)
            .or(`sender_id.eq.${user_id},receiver_id.eq.${user_id}`);
        }
      } else {
        // For direct chat, just get messages between the two users
        query = query
          .or(`sender_id.eq.${user_id},receiver_id.eq.${user_id}`)
          .or(`sender_id.eq.${other_user_id},receiver_id.eq.${other_user_id}`);
      }
      
      const { data: directMessages, error: directError } = await query
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


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
    const { user_id, other_user_id, is_group_chat = true, care_team_members = [], page = 1, per_page = 50 } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
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
    
    console.log("Fetching messages for user:", user_id, "and patient:", other_user_id, "isGroupChat:", is_group_chat);
    
    // Get the roles of both users to determine context
    const { data: otherUserData, error: otherUserError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', other_user_id)
      .maybeSingle();
      
    const { data: userRoleData, error: userRoleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .maybeSingle();
    
    const userRole = userRoleData?.role || "unknown";
    const otherUserRole = otherUserData?.role || "unknown";
    console.log("User role:", userRole, "Other user role:", otherUserRole);
    
    let patientId = null;
    
    // Determine which user is the patient
    if (userRole === 'patient') {
      // If current user is a patient, we're in a care team chat for this patient
      patientId = user_id;
      console.log("This is a care team chat for patient (user is patient):", patientId);
    } else if (otherUserRole === 'patient') {
      // If other user is a patient, we're in a care team chat for this patient
      patientId = other_user_id;
      console.log("This is a care team chat for patient:", patientId);
    }
    
    try {
      if (patientId) {
        console.log("Getting care team messages for patient:", patientId);
        
        // Use the get_care_team_messages RPC function for care team messages
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
        
        console.log(`Retrieved ${messages?.length || 0} care team messages`);
        
        // Mark any unread messages as read if the current user is the recipient
        if (messages && messages.length > 0) {
          try {
            // Group messages by sender_id to efficiently mark them as read
            const senderIds = new Set<string>();
            messages.forEach(msg => {
              if (msg.sender && msg.sender.id !== user_id && !msg.read) {
                senderIds.add(msg.sender.id);
              }
            });
            
            // Mark messages as read for each sender
            for (const senderId of senderIds) {
              await supabaseClient.functions.invoke('mark-messages-as-read', {
                body: { 
                  user_id: user_id, 
                  sender_id: senderId 
                }
              });
            }
          } catch (markError) {
            console.warn("Error marking messages as read:", markError);
            // Continue processing even if marking as read fails
          }
        }
        
        return new Response(
          JSON.stringify({
            messages: messages || [],
            hasMore: messages && messages.length === perPage,
            page: pageNumber,
            perPage
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // If no patient is identified, return an empty array
        console.log("No patient identified, returning empty messages array");
        
        return new Response(
          JSON.stringify({
            messages: [],
            hasMore: false,
            page: pageNumber,
            perPage
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (fnError) {
      console.error("Error in primary message function:", fnError);
      
      // Return a proper error response
      return new Response(
        JSON.stringify({ 
          error: "Error processing messages", 
          details: fnError.message 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

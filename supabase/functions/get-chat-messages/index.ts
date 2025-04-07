
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
    const { user_id, other_user_id, is_group_chat = false, care_team_members = [], page = 1, per_page = 50 } = await req.json();
    
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
    
    console.log("Fetching messages for user:", user_id, "and other user:", other_user_id, "isGroupChat:", is_group_chat);
    
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
    
    let isPatientCareTeamChat = false;
    let patientId = null;
    
    // Determine if this is a patient care team chat
    if (is_group_chat) {
      console.log("This is explicitly a group chat");
      if (userRole === 'patient') {
        // If current user is a patient, we're in a care team chat for this patient
        isPatientCareTeamChat = true;
        patientId = user_id;
        console.log("This is a care team chat for patient (user is patient):", patientId);
      } else if (otherUserRole === 'patient') {
        // If other user is a patient, we're in a care team chat for this patient
        isPatientCareTeamChat = true;
        patientId = other_user_id;
        console.log("This is a care team chat for patient:", patientId);
      }
    } else {
      // For backward compatibility - detect based on role
      if (otherUserRole === 'patient') {
        // If other user is a patient, we're in a care team chat for this patient
        isPatientCareTeamChat = true;
        patientId = other_user_id;
        console.log("This is a care team chat for patient (auto-detected):", patientId);
      } else if (userRole === 'patient') {
        // If current user is a patient, we're in a care team chat for this patient
        isPatientCareTeamChat = true;
        patientId = user_id;
        console.log("This is a care team chat for patient (user is patient, auto-detected):", patientId);
      }
    }
    
    try {
      if (isPatientCareTeamChat && patientId) {
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
        // Regular one-to-one chat
        console.log("Getting direct messages between:", user_id, "and", other_user_id);
        
        // Use the get_user_chat_messages RPC function for direct messages
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
        
        // Mark messages as read if the current user is the recipient
        if (directMessages && directMessages.length > 0) {
          try {
            await supabaseClient.functions.invoke('mark-messages-as-read', {
              body: { 
                user_id: user_id, 
                sender_id: other_user_id 
              }
            });
          } catch (markError) {
            console.warn("Error marking messages as read:", markError);
            // Continue processing even if marking as read fails
          }
        }
        
        return new Response(
          JSON.stringify({
            messages: directMessages || [],
            hasMore: directMessages && directMessages.length === perPage,
            page: pageNumber,
            perPage
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (fnError) {
      console.error("Error in primary message function:", fnError);
      
      // Simplified fallback query that properly handles the read column
      const query = supabaseClient
        .from('chat_messages')
        .select(`
          id,
          message,
          message_type,
          created_at,
          read,
          sender:profiles!chat_messages_sender_id_fkey(id, first_name, last_name),
          receiver:profiles!chat_messages_receiver_id_fkey(id, first_name, last_name)
        `);
        
      // Determine which users to include in the query based on context
      if (patientId) {
        // For care team chat, get messages involving the patient and current user
        query.or(`sender_id.eq.${patientId},sender_id.eq.${user_id},receiver_id.eq.${patientId},receiver_id.eq.${user_id}`);
      } else {
        // For direct chat, just get messages between the two users
        query.or(`and(sender_id.eq.${user_id},receiver_id.eq.${other_user_id}),and(sender_id.eq.${other_user_id},receiver_id.eq.${user_id})`);
      }
      
      const { data: fallbackMessages, error: fallbackError } = await query
        .order('created_at', { ascending: true })
        .range(offset, offset + perPage - 1);
      
      if (fallbackError) {
        console.error("Error in fallback query:", fallbackError);
        throw fallbackError;
      }
      
      console.log(`Retrieved ${fallbackMessages?.length || 0} messages using fallback method`);
      
      // Format the messages to match expected structure
      const formattedMessages = fallbackMessages?.map(msg => ({
        ...msg,
        message_type: msg.message_type || "text",
        read: msg.read !== null ? msg.read : false
      })) || [];
      
      return new Response(
        JSON.stringify({
          messages: formattedMessages,
          hasMore: fallbackMessages && fallbackMessages.length === perPage,
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

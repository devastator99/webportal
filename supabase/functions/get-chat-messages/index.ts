
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Set the page size to load enough messages
const DEFAULT_PAGE_SIZE = 100;

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      user_id, 
      other_user_id, 
      email = null,
      is_group_chat = false, 
      care_team_members = [], 
      include_care_team_messages = false,
      is_patient = false,
      page = 1, 
      per_page = DEFAULT_PAGE_SIZE 
    } = await req.json();
    
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
    
    console.log("Fetching messages with params:", {
      user_id, 
      other_user_id, 
      email,
      is_group_chat, 
      include_care_team_messages,
      is_patient,
      care_team_members: care_team_members?.length || 0,
      page: pageNumber,
      perPage: perPage
    });
    
    // Look up user by email if provided (e.g., prakash@test.com)
    let specificUserId = other_user_id;
    
    if (email) {
      console.log("Looking up user by email:", email);
      const { data: userData, error: userError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
        
      if (userError) {
        console.error("Error looking up user by email:", userError);
      } else if (userData) {
        specificUserId = userData.id;
        console.log("Found user ID for email:", specificUserId);
      }
    }
    
    // Get the roles of both users to determine context
    const { data: userRoleData, error: userRoleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .maybeSingle();
      
    if (userRoleError) {
      console.error("Error fetching user role:", userRoleError);
    }
    
    let otherUserRoleData = null;
    let otherUserRoleError = null;
    
    if (specificUserId) {
      const result = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', specificUserId)
        .maybeSingle();
        
      otherUserRoleData = result.data;
      otherUserRoleError = result.error;
      
      if (otherUserRoleError) {
        console.error("Error fetching other user role:", otherUserRoleError);
      }
    }
    
    const userRole = userRoleData?.role || "unknown";
    const otherUserRole = otherUserRoleData?.role || "unknown";
    console.log("User role:", userRole, "Other user role:", otherUserRole);
    
    let patientId = null;
    
    // Determine which user is the patient for care team context
    if (is_group_chat || include_care_team_messages) {
      if (userRole === 'patient' || is_patient) {
        // If current user is a patient, we're in a care team chat for this patient
        patientId = user_id;
        console.log("Patient is current user:", patientId);
      } else if (otherUserRole === 'patient') {
        // If other user is a patient, we're in a care team chat for this patient
        patientId = specificUserId;
        console.log("Patient is other user:", patientId);
      } else if (userRole === 'doctor' || userRole === 'nutritionist') {
        // If provider is looking at a specific patient
        patientId = specificUserId;
        console.log("Provider viewing patient:", patientId);
      }
    }
    
    try {
      // Always make sure we have a patient ID to use for the care team
      if (!patientId && specificUserId) {
        patientId = specificUserId;
        console.log("Using specificUserId as fallback patient_id:", patientId);
      }
      
      // If user is a patient and viewing their own care team, always use their ID
      if ((userRole === 'patient' || is_patient) && !patientId) {
        patientId = user_id;
        console.log("Patient viewing their own messages, using own ID:", patientId);
      }
      
      if (!patientId && (userRole === 'patient' || is_patient)) {
        // For patients without a specific patientId, use their own ID
        patientId = user_id;
        console.log("Default to using patient's own ID:", patientId);
      }

      if (!patientId) {
        console.error("Could not determine patient ID");
        return new Response(
          JSON.stringify({ 
            error: "Could not determine patient ID", 
            messages: [], 
            hasMore: false, 
            page: pageNumber, 
            perPage 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log("Getting care team messages for patient:", patientId);
      
      // For specific user lookup by email, we might want to get direct messages or all messages
      let messagesQuery;
      
      if (email && specificUserId) {
        // If looking for messages from a specific user by email
        console.log("Looking for messages from specific user:", specificUserId);
        
        // Get both direct messages and care team messages where this user is the sender
        // We need to order by created_at DESC for newest-first
        const { data: specificMessages, error: specificError } = await supabaseClient
          .from('chat_messages')
          .select(`
            id,
            message,
            message_type,
            created_at,
            read,
            sender:sender_id (id, first_name, last_name),
            receiver:receiver_id (id, first_name, last_name)
          `)
          .eq('sender_id', specificUserId)
          .order('created_at', { ascending: false })  // Changed to DESC for newest first
          .limit(perPage)
          .offset(offset);
          
        if (specificError) {
          console.error("Error fetching specific user messages:", specificError);
          throw specificError;
        }
        
        messagesQuery = { data: specificMessages, error: null };
      } else if (userRole === 'patient' || is_patient) {
        // Special handling for patients to ensure they always see their messages
        console.log("Using patient-specific query to ensure all messages are retrieved");
        
        // Get all messages where the patient is either sender or receiver - explicitly log pagination details
        console.log(`Fetching patient messages with offset: ${offset}, limit: ${perPage}`);
        const { data: patientMessages, error: patientError } = await supabaseClient
          .rpc('get_care_team_messages', {
            p_user_id: user_id,
            p_patient_id: patientId,
            p_offset: offset,
            p_limit: perPage
          });
        
        if (patientError) {
          console.error("Error fetching patient messages:", patientError);
          throw patientError;
        }
        
        console.log(`Retrieved ${patientMessages?.length || 0} patient messages`);
        
        // Sort messages by created_at in descending order (newest first)
        const sortedMessages = patientMessages?.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        messagesQuery = { data: sortedMessages, error: null };
      } else {
        // Use the standard get_care_team_messages RPC function for all messages
        console.log(`Fetching care team messages with offset: ${offset}, limit: ${perPage}`);
        const { data, error } = await supabaseClient.rpc('get_care_team_messages', {
          p_user_id: user_id,
          p_patient_id: patientId,
          p_offset: offset,
          p_limit: perPage
        });
        
        if (error) {
          console.error("Error in care team messages RPC:", error);
          throw error;
        }
        
        // Sort messages by created_at in descending order (newest first)
        const sortedMessages = data?.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        messagesQuery = { data: sortedMessages, error: null };
      }
      
      const { data: messages, error: messagesError } = messagesQuery;
      
      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        throw messagesError;
      }
      
      console.log(`Retrieved ${messages?.length || 0} messages total`);
      
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
            const { error: markError } = await supabaseClient.functions.invoke('mark-messages-as-read', {
              body: { 
                user_id: user_id, 
                sender_id: senderId 
              }
            });
            
            if (markError) {
              console.warn("Error marking messages as read:", markError);
            }
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
          perPage,
          timestamp: new Date().toISOString() // Add timestamp for debugging
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

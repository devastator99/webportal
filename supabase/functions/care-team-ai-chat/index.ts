
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// OpenAI API configuration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// AI Bot ID - this is now a real user in the system
const AI_BOT_ID = '00000000-0000-0000-0000-000000000000';

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the auth context of the request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: req.headers.get('Authorization')! } 
        } 
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get request body
    const { roomId, message } = await req.json();

    if (!roomId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the user is a member of this room
    const { data: roomMember, error: roomError } = await supabaseClient
      .from('room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (roomError || !roomMember) {
      return new Response(
        JSON.stringify({ error: 'Access denied: Not a member of this room' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user's role and name for better context
    const { data: userData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();
      
    const userName = userData ? 
      `${userData.first_name || ''} ${userData.last_name || ''}`.trim() : 
      'User';

    // Get room details and patient info
    const { data: roomData, error: roomDetailsError } = await supabaseClient
      .from('chat_rooms')
      .select('patient_id, name')
      .eq('id', roomId)
      .single();
      
    if (roomDetailsError) {
      console.error("Error fetching room details:", roomDetailsError);
    }
    
    let patientName = "the patient";
    if (roomData?.patient_id) {
      const { data: patientData } = await supabaseClient
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', roomData.patient_id)
        .single();
        
      if (patientData) {
        patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim();
      }
    }

    // Get room message history for context
    const { data: messageHistory, error: historyError } = await supabaseClient
      .from('room_messages')
      .select(`
        id,
        sender_id,
        message,
        is_system_message,
        is_ai_message,
        created_at
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (historyError) {
      console.error("Error fetching message history:", historyError);
    }

    // Build conversation history with sender information
    const conversationHistory = [];
    
    if (messageHistory && messageHistory.length > 0) {
      for (const msg of messageHistory) {
        let senderName = "Unknown";
        let senderRole = "unknown";
        
        // Get sender profile
        const { data: sender } = await supabaseClient
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', msg.sender_id)
          .single();
          
        if (sender) {
          senderName = `${sender.first_name || ''} ${sender.last_name || ''}`.trim();
        }
        
        // Get sender role
        const { data: roleData } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', msg.sender_id)
          .single();
          
        if (roleData) {
          senderRole = roleData.role;
        }
        
        conversationHistory.push({
          role: msg.is_ai_message ? "assistant" : "user",
          content: `${msg.is_ai_message ? '' : `${senderName} (${senderRole}): `}${msg.message}`
        });
      }
    }

    // Prepare AI chat request
    const aiMessages = [
      {
        role: "system",
        content: `You are an AI healthcare assistant in a care team chat for ${patientName}. 
        Your goal is to provide helpful, accurate, and supportive information to both the patient and healthcare providers.
        
        Guidelines:
        - Be professional and compassionate
        - Be concise but thorough
        - Do not diagnose but help clarify medical information
        - When medical questions arise, suggest consulting with the doctor
        - Support both patients and healthcare providers in the conversation
        - For nutrition questions, refer to the nutritionist when possible
        - Always maintain a helpful and supportive tone
        - When appropriate, suggest questions the patient might want to ask their doctor or nutritionist`
      },
      ...conversationHistory,
      {
        role: "user",
        content: `${userName} (${roomMember.role}): ${message}`
      }
    ];

    // Call OpenAI API
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("Sending request to OpenAI with", aiMessages.length, "messages in context");
    
    const openAIResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using the more efficient model
        messages: aiMessages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    const openAIData = await openAIResponse.json();
    
    if (!openAIData.choices || !openAIData.choices[0]) {
      console.error("OpenAI error:", openAIData);
      return new Response(
        JSON.stringify({ error: 'Failed to get AI response', details: openAIData }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const aiResponseText = openAIData.choices[0].message.content.trim();
    console.log("AI response:", aiResponseText.substring(0, 100) + "...");

    // Save AI response to the room
    const { data: aiMessageData, error: aiMessageError } = await supabaseClient
      .from('room_messages')
      .insert({
        room_id: roomId,
        sender_id: AI_BOT_ID, // AI bot ID
        message: aiResponseText,
        is_system_message: false,
        is_ai_message: true,
        read_by: [user.id] // Mark as read by the user who triggered it
      })
      .select()
      .single();

    if (aiMessageError) {
      console.error("Error saving AI message:", aiMessageError);
      return new Response(
        JSON.stringify({ error: 'Failed to save AI response', details: aiMessageError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: aiResponseText,
        messageId: aiMessageData.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Care team AI chat error:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

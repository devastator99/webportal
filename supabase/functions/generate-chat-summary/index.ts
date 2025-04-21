
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

interface RequestBody {
  roomId: string;
}

serve(async (req) => {
  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get request body
    const { roomId } = await req.json() as RequestBody;
    
    if (!roomId) {
      return new Response(
        JSON.stringify({ error: 'Room ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch the most recent messages (up to 100)
    const { data: messages, error: messagesError } = await supabase
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch messages' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the room details to identify the patient
    const { data: roomData, error: roomError } = await supabase
      .from('chat_rooms')
      .select('*, profiles:patient_id(first_name, last_name)')
      .eq('id', roomId)
      .single();
      
    if (roomError) {
      console.error('Error fetching room details:', roomError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch room details' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Prepare the conversation history for summarization
    const conversationHistory = messages
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(async (msg) => {
        // Get sender name
        let senderName = 'Unknown User';
        
        if (msg.sender_id === '00000000-0000-0000-0000-000000000000') {
          senderName = 'AI Assistant';
        } else {
          const { data: senderData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', msg.sender_id)
            .single();
            
          if (senderData) {
            senderName = `${senderData.first_name || ''} ${senderData.last_name || ''}`.trim();
          }
        }
        
        // Get sender role
        let role = 'unknown';
        if (msg.sender_id === '00000000-0000-0000-0000-000000000000') {
          role = 'AI Assistant';
        } else {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', msg.sender_id)
            .single();
            
          if (roleData) {
            role = roleData.role;
          }
        }
        
        return `${senderName} (${role}): ${msg.message}`;
      });
      
    // Resolve all the promises
    const conversationText = (await Promise.all(conversationHistory)).join('\n');
    
    // Get the patient name
    const patientName = roomData.profiles 
      ? `${roomData.profiles.first_name || ''} ${roomData.profiles.last_name || ''}`.trim()
      : 'the patient';
    
    // Use OpenAI to generate a summary
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const prompt = `Please provide a concise summary of the following healthcare chat conversation with ${patientName}. 
Focus on key medical information, agreed actions, followups needed, and any important patient concerns.
Format the summary with clear sections for: Medical Information, Action Items, and Patient Concerns.

Conversation:
${conversationText}`;
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a medical assistant providing concise summaries of patient conversations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500
      })
    });
    
    const openAIData = await openAIResponse.json();
    
    if (!openAIData.choices || !openAIData.choices.length) {
      console.error('Invalid response from OpenAI:', openAIData);
      return new Response(
        JSON.stringify({ error: 'Failed to generate summary' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const summaryText = openAIData.choices[0].message.content;
    
    // Post the summary as a message from the AI Assistant
    const { data: summaryMessage, error: summaryError } = await supabase
      .from('room_messages')
      .insert({
        room_id: roomId,
        sender_id: '00000000-0000-0000-0000-000000000000', // AI Assistant ID
        message: `📋 **Chat Summary**\n\n${summaryText}`,
        is_ai_message: true,
        is_system_message: false,
        read_by: []
      })
      .select()
      .single();
      
    if (summaryError) {
      console.error('Error posting summary message:', summaryError);
      return new Response(
        JSON.stringify({ error: 'Failed to post summary message' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Summary generated and posted to chat',
        summary_id: summaryMessage.id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
})

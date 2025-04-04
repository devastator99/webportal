
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from './config.ts';
import { fetchKnowledgeForQuery } from './knowledgeService.ts';
import { buildSystemMessage } from './systemMessageService.ts';
import { getAIResponse } from './aiService.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      messages, 
      imageUrl, 
      preferredLanguage = 'en', 
      documentId,
      patientId,
      isCareTeamChat = false
    } = await req.json();

    // Create a Supabase client with the Admin key to query the database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1].content;
    
    // Fetch relevant knowledge based on the query and patient ID if available
    const knowledgeContext = await fetchKnowledgeForQuery(
      lastUserMessage, 
      supabaseAdmin, 
      patientId
    );
    
    // If a specific document ID was provided, add its content to the context
    let documentContext = "";
    if (documentId) {
      try {
        const { data: document, error } = await supabaseAdmin
          .from('analyzed_documents')
          .select('original_filename, analysis_text')
          .eq('id', documentId)
          .single();
        
        if (error) {
          console.error('Error fetching specific document:', error);
        } else if (document) {
          documentContext = `\nSpecific document reference:\nDocument: ${document.original_filename}\nAnalysis: ${document.analysis_text}\n`;
        }
      } catch (err) {
        console.error('Error processing document reference:', err);
      }
    }
    
    // Build the system message with context
    const systemMessage = buildSystemMessage(
      preferredLanguage, 
      knowledgeContext + documentContext,
      isCareTeamChat
    );

    // Prepare the messages array
    const formattedMessages = [
      { role: "system", content: systemMessage },
      ...messages
    ];

    // If there's an image, add it to the last user message
    if (imageUrl && messages.length > 0) {
      const lastMessage = formattedMessages[formattedMessages.length - 1];
      if (lastMessage.role === 'user') {
        lastMessage.content = [
          { type: "text", text: lastMessage.content },
          { type: "image_url", image_url: imageUrl }
        ];
      }
    }

    // Get AI response
    const data = await getAIResponse(formattedMessages);
    
    return new Response(
      JSON.stringify({ 
        response: data.choices[0].message.content,
        readStatus: isCareTeamChat ? "read" : null // Add read status for care team chat
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

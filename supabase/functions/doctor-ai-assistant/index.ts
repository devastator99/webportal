
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
      isCareTeamChat = false,
      patientContext = {}
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
    
    // Log for debugging
    console.log(`Processing message: "${lastUserMessage}" for patient ID: ${patientId}`);
    console.log("Patient context:", JSON.stringify(patientContext));
    
    // Fetch relevant knowledge based on the query and patient ID if available
    const knowledgeContext = await fetchKnowledgeForQuery(
      lastUserMessage, 
      supabaseAdmin, 
      patientId
    );

    console.log(`Knowledge context length: ${knowledgeContext.length} chars`);
    
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
    
    // If patientContext doesn't have enough information, try to fetch directly from the database
    let enhancedContext = "";
    
    if (patientId && Object.keys(patientContext).length < 2) {
      try {
        // Get patient information
        const { data: patientData, error: patientError } = await supabaseAdmin
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', patientId)
          .single();
          
        if (!patientError && patientData) {
          enhancedContext += `\nPatient Name: ${patientData.first_name} ${patientData.last_name}\n`;
        }
        
        // Check if the patient has any care team assignments
        const { data: careTeamData, error: careTeamError } = await supabaseAdmin
          .rpc('get_patient_care_team_members', { p_patient_id: patientId });
          
        if (!careTeamError && careTeamData && Array.isArray(careTeamData)) {
          const doctorMember = careTeamData.find((member: any) => member.role === 'doctor');
          
          if (doctorMember) {
            enhancedContext += `The patient is assigned to Dr. ${doctorMember.first_name} ${doctorMember.last_name}.\n`;
          } else {
            enhancedContext += `The patient is currently not assigned to any doctor.\n`;
          }
          
          const nutritionistMember = careTeamData.find((member: any) => member.role === 'nutritionist');
          if (nutritionistMember) {
            enhancedContext += `The patient is working with nutritionist ${nutritionistMember.first_name} ${nutritionistMember.last_name}.\n`;
          }
        } else {
          enhancedContext += `The patient is currently not assigned to any care team members.\n`;
        }
      } catch (err) {
        console.error('Error fetching additional patient context:', err);
      }
    }
    
    // Use verified context from patientContext or enhancedContext
    let verifiedContext = "";
    if (Object.keys(patientContext).length > 0) {
      if (patientContext.patientName) {
        verifiedContext += `\nPatient Name: ${patientContext.patientName}\n`;
      }
      
      if (patientContext.hasDoctorAssigned === true && patientContext.doctorName) {
        verifiedContext += `The patient is assigned to ${patientContext.doctorName}.\n`;
      } else {
        verifiedContext += `The patient is currently not assigned to any doctor.\n`;
      }
    } else if (enhancedContext) {
      verifiedContext = enhancedContext;
    }
    
    // Build the system message with context
    const systemMessage = buildSystemMessage(
      preferredLanguage, 
      knowledgeContext + documentContext + verifiedContext,
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

    console.log("Sending request to OpenAI");
    
    // Get AI response
    const data = await getAIResponse(formattedMessages);
    
    console.log("Got response from OpenAI");
    
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

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INDIAN_LANGUAGES = {
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali",
  mr: "Marathi",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, imageUrl, preferredLanguage = 'en' } = await req.json();

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

    // Prepare system message
    let systemMessage = "You are a helpful medical assistant for an endocrinology clinic in India. Your name is Anoobhooti Assistant. ";
    systemMessage += "You provide information about our clinic, services, doctors, and answer general questions about endocrinology. ";
    systemMessage += "You are not a doctor and cannot provide medical advice, only general information. ";
    systemMessage += "Always encourage users to book an appointment for medical concerns. ";
    
    // Add language specific instructions
    if (preferredLanguage && preferredLanguage !== 'en') {
      const languageName = INDIAN_LANGUAGES[preferredLanguage as keyof typeof INDIAN_LANGUAGES] || '';
      if (languageName) {
        systemMessage += `The user prefers to communicate in ${languageName}. Please respond in ${languageName}. `;
        systemMessage += "Provide all your responses in both the preferred language and English for clarity. ";
      }
    }
    
    // Add cultural context
    systemMessage += "Be respectful and use appropriate honorifics (ji, etc.) when addressing users. ";
    systemMessage += "Be aware of Indian cultural context around health and medicine, including traditional and Ayurvedic concepts. ";
    systemMessage += "When discussing costs, use INR (₹) as the currency. ";
    systemMessage += "When discussing treatments, be aware of Indian healthcare system specifics like Ayushman Bharat, etc. ";
    systemMessage += "Be concise and friendly in your responses.";

    // Preprocess the user's last message to identify if they're asking about specific topics
    const lastUserMessage = messages[messages.length - 1].content;
    
    // Determine if we should fetch knowledge for specific topics
    let isPackageQuery = lastUserMessage.toLowerCase().includes('package') || 
                          lastUserMessage.toLowerCase().includes('cost') || 
                          lastUserMessage.toLowerCase().includes('price') ||
                          lastUserMessage.toLowerCase().includes('fee');
                          
    let isDoctorQuery = lastUserMessage.toLowerCase().includes('doctor') || 
                         lastUserMessage.toLowerCase().includes('physician') || 
                         lastUserMessage.toLowerCase().includes('specialist') ||
                         lastUserMessage.toLowerCase().includes('ayurvedic');
                         
    let isClinicQuery = lastUserMessage.toLowerCase().includes('clinic') || 
                         lastUserMessage.toLowerCase().includes('location') || 
                         lastUserMessage.toLowerCase().includes('timing') || 
                         lastUserMessage.toLowerCase().includes('contact') ||
                         lastUserMessage.toLowerCase().includes('address');
                         
    let isFaqQuery = lastUserMessage.toLowerCase().includes('faq') || 
                      lastUserMessage.toLowerCase().includes('question');
                      
    let isInsuranceQuery = lastUserMessage.toLowerCase().includes('insurance') || 
                           lastUserMessage.toLowerCase().includes('cover') || 
                           lastUserMessage.toLowerCase().includes('ayushman') ||
                           lastUserMessage.toLowerCase().includes('cghs') ||
                           lastUserMessage.toLowerCase().includes('policy');
    
    // Prepare knowledge context from database based on query
    let knowledgeContext = "";
    
    if (isPackageQuery) {
      const { data: packagesData } = await supabaseAdmin.rpc('get_chatbot_knowledge', { topic_filter: 'packages' });
      if (packagesData && packagesData.length > 0) {
        const packages = packagesData[0].content;
        knowledgeContext += "Here is information about our packages:\n";
        packages.forEach((pkg: any) => {
          knowledgeContext += `- ${pkg.name}: ₹${pkg.price} - ${pkg.description}\n`;
        });
      }
    }
    
    if (isDoctorQuery) {
      // Get doctor information from the database using the new RPC function
      const { data: doctorsData, error: doctorsError } = await supabaseAdmin.rpc('get_doctors_for_chatbot');
      
      if (doctorsError) {
        console.error('Error fetching doctors:', doctorsError);
      }
      
      if (doctorsData && doctorsData.doctors && doctorsData.doctors.length > 0) {
        knowledgeContext += "Here is information about our doctors:\n";
        doctorsData.doctors.forEach((doc: any) => {
          knowledgeContext += `- Dr. ${doc.name}`;
          if (doc.specialty) knowledgeContext += `, ${doc.specialty}`;
          if (doc.consultation_fee) knowledgeContext += `, Consultation Fee: ₹${doc.consultation_fee}`;
          knowledgeContext += `\n`;
          
          if (doc.visiting_hours) knowledgeContext += `  Visiting Hours: ${doc.visiting_hours}\n`;
          if (doc.clinic_location) knowledgeContext += `  Location: ${doc.clinic_location}\n`;
        });
      } else {
        // Fallback to the chatbot knowledge table if no doctors found in profiles
        const { data: oldDoctorsData } = await supabaseAdmin.rpc('get_chatbot_knowledge', { topic_filter: 'doctors' });
        if (oldDoctorsData && oldDoctorsData.length > 0) {
          const doctors = oldDoctorsData[0].content;
          knowledgeContext += "Here is information about our doctors:\n";
          doctors.forEach((doc: any) => {
            knowledgeContext += `- ${doc.name}, ${doc.specialty}, ${doc.experience} experience, ${doc.qualifications}\n`;
          });
        }
      }
    }
    
    if (isClinicQuery) {
      const { data: clinicData } = await supabaseAdmin.rpc('get_chatbot_knowledge', { topic_filter: 'clinic' });
      if (clinicData && clinicData.length > 0) {
        const clinic = clinicData[0].content;
        knowledgeContext += `Our clinic ${clinic.name} is located at ${clinic.address}. `;
        knowledgeContext += `We are open weekdays ${clinic.hours.weekdays}, Saturday ${clinic.hours.saturday}, and ${clinic.hours.sunday} on Sunday. `;
        knowledgeContext += `Contact: Phone ${clinic.phone}, Email ${clinic.email}\n`;
      }
    }
    
    if (isFaqQuery) {
      const { data: faqsData } = await supabaseAdmin.rpc('get_chatbot_knowledge', { topic_filter: 'faqs' });
      if (faqsData && faqsData.length > 0) {
        const faqs = faqsData[0].content;
        knowledgeContext += "Here are frequently asked questions:\n";
        faqs.forEach((faq: any) => {
          knowledgeContext += `Q: ${faq.question}\nA: ${faq.answer}\n\n`;
        });
      }
    }
    
    if (isInsuranceQuery) {
      knowledgeContext += "Here is information about insurance and payment options:\n";
      knowledgeContext += "- We accept most major health insurance providers in India including Star Health, HDFC ERGO, and Bajaj Allianz.\n";
      knowledgeContext += "- We are empanelled with Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY).\n";
      knowledgeContext += "- Central Government Health Scheme (CGHS) coverage is available for eligible patients.\n";
      knowledgeContext += "- We also accept cash, UPI payments (PhonePe, Google Pay, Paytm), credit cards, and debit cards.\n";
      knowledgeContext += "- EMI options are available for treatment packages above ₹10,000.\n";
    }
    
    // Add information about traditional medicine integration
    knowledgeContext += "\nOur clinic combines modern endocrinology with traditional Indian medicine approaches when appropriate. ";
    knowledgeContext += "We offer lifestyle modification programs based on Ayurvedic principles alongside conventional treatments. ";
    knowledgeContext += "Our dieticians are familiar with regional Indian diets and can provide culturally appropriate nutrition advice. ";

    // Prepare the messages array
    const formattedMessages = [
      {
        role: "system",
        content: systemMessage + (knowledgeContext ? "\n\nUse this information to respond: " + knowledgeContext : "")
      },
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: formattedMessages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({ response: data.choices[0].message.content }),
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

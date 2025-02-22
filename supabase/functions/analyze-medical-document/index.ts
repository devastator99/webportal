
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const extractTextFromPDF = async (pdfBytes: Uint8Array) => {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const pages = pdfDoc.getPages()
  let text = ''
  
  // Extract text from each page
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const { width, height } = page.getSize()
    text += `Page ${i + 1} (${width}x${height}):\n`
    // Note: This is a simplified text extraction.
    // For production, you might want to use a more sophisticated PDF text extraction library
    text += page.toString() + '\n'
  }
  
  return text
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileUrl, fileType } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Download the file from storage
    const response = await fetch(fileUrl)
    const fileContent = await response.blob()

    let content = ''
    if (fileType === 'application/pdf') {
      const arrayBuffer = await fileContent.arrayBuffer()
      content = await extractTextFromPDF(new Uint8Array(arrayBuffer))
    } else {
      // For images, we'll send them directly to GPT-4 Vision
      const base64Image = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(fileContent)
      })
      content = base64Image as string
    }

    // Analyze the content with GPT-4
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a medical document analyzer. Extract and summarize key medical information from the provided document or image. Focus on diagnoses, treatments, medications, and important medical observations.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this medical document and provide a structured summary of the key medical information:'
              },
              fileType.startsWith('image/') ? {
                type: 'image_url',
                image_url: {
                  url: content,
                }
              } : {
                type: 'text',
                text: content
              }
            ]
          }
        ],
        max_tokens: 500,
      }),
    })

    const analysisResult = await openAIResponse.json()
    
    return new Response(
      JSON.stringify({ 
        analysis: analysisResult.choices[0].message.content,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error analyzing document:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

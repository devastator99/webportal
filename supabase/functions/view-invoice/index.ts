
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as base64 from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/pdf",
};

interface InvoiceData {
  id: string;
  invoice_number: string;
  amount: number;
  created_at: string;
  description: string;
  status: string;
  patient_id: string;
  doctor_id: string | null;
  patient_first_name: string;
  patient_last_name: string;
  doctor_first_name?: string;
  doctor_last_name?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const invoiceId = url.pathname.split("/").pop();
    
    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: "Invoice ID is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );
    
    // Get invoice data
    const { data: invoiceData, error: invoiceError } = await supabaseClient
      .from('patient_invoices')
      .select(`
        id, invoice_number, amount, created_at, description, status, 
        patient_id, doctor_id,
        patient:patient_id (first_name, last_name),
        doctor:doctor_id (first_name, last_name)
      `)
      .eq('id', invoiceId)
      .single();
    
    if (invoiceError || !invoiceData) {
      console.error("Error fetching invoice data:", invoiceError);
      return new Response(
        JSON.stringify({ error: invoiceError?.message || "Invoice not found" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }
    
    const formattedInvoice: InvoiceData = {
      id: invoiceData.id,
      invoice_number: invoiceData.invoice_number,
      amount: invoiceData.amount,
      created_at: invoiceData.created_at,
      description: invoiceData.description,
      status: invoiceData.status,
      patient_id: invoiceData.patient_id,
      doctor_id: invoiceData.doctor_id,
      patient_first_name: invoiceData.patient?.first_name || "",
      patient_last_name: invoiceData.patient?.last_name || "",
      doctor_first_name: invoiceData.doctor?.first_name || "",
      doctor_last_name: invoiceData.doctor?.last_name || "",
    };
    
    // Generate PDF content
    const pdfContent = generateInvoicePdf(formattedInvoice);
    
    // Return the PDF
    return new Response(pdfContent, { 
      headers: corsHeaders,
      status: 200 
    });
    
  } catch (error: any) {
    console.error("Error in view-invoice function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

// Function to generate a simple PDF invoice
function generateInvoicePdf(invoice: InvoiceData): Uint8Array {
  // In a real application, you would use a library like jspdf
  // Here's a placeholder implementation that returns a simple PDF
  
  // For demo purposes, we're returning a base64-encoded "PDF" 
  // that just displays some text. In production, you would generate 
  // a proper PDF document here.
  
  // This is a placeholder. In a real implementation, you would generate
  // an actual PDF using libraries like jspdf
  const pdfTemplate = `
%PDF-1.4
1 0 obj
<</Type /Catalog /Pages 2 0 R>>
endobj
2 0 obj
<</Type /Pages /Kids [3 0 R] /Count 1>>
endobj
3 0 obj
<</Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 595 842] /Contents 6 0 R>>
endobj
4 0 obj
<</Font <</F1 5 0 R>>>>
endobj
5 0 obj
<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>
endobj
6 0 obj
<</Length 313>>
stream
BT
/F1 24 Tf
30 800 Td
(INVOICE) Tj
/F1 12 Tf
0 -40 Td
(Invoice Number: ${invoice.invoice_number}) Tj
0 -20 Td
(Date: ${new Date(invoice.created_at).toLocaleDateString()}) Tj
0 -20 Td
(Patient: ${invoice.patient_first_name} ${invoice.patient_last_name}) Tj
0 -20 Td
(Amount: ₹${invoice.amount.toFixed(2)}) Tj
0 -20 Td
(Description: ${invoice.description}) Tj
0 -20 Td
(Status: ${invoice.status.toUpperCase()}) Tj
ET
endstream
endobj
xref
0 7
0000000000 65535 f
0000000009 00000 n
0000000056 00000 n
0000000111 00000 n
0000000212 00000 n
0000000250 00000 n
0000000317 00000 n
trailer
<</Size 7/Root 1 0 R>>
startxref
526
%%EOF
  `.trim();
  
  return new TextEncoder().encode(pdfTemplate);
}

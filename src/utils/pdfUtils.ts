
import html2pdf from 'html2pdf.js';

/**
 * Generates and downloads a PDF from the specified HTML element
 * @param elementId - The ID of the HTML element to convert to PDF
 * @param filename - The name of the PDF file to download
 * @returns Promise that resolves when the PDF has been generated and downloaded
 */
export const generatePdfFromElement = async (
  elementId: string, 
  filename: string = 'document.pdf'
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }
    
    const options = {
      margin: 10,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    await html2pdf().set(options).from(element).save();
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Promise.reject(error);
  }
};

/**
 * Determines if a query is related to PDF generation
 * @param query The user's query text
 * @returns boolean indicating if the query is PDF-related
 */
export const isPdfRelatedQuery = (query: string): boolean => {
  const pdfKeywords = [
    'pdf', 'document', 'download', 'print', 'report', 
    'prescription pdf', 'health plan pdf', 'medical report pdf',
    'share my prescription', 'share my health plan', 'share my medical report',
    'generate pdf', 'create pdf', 'export'
  ];
  
  const lowerQuery = query.toLowerCase();
  return pdfKeywords.some(keyword => lowerQuery.includes(keyword));
};

/**
 * Determines what type of PDF the user is requesting
 * @param query The user's query text
 * @returns The type of PDF requested or null if undetermined
 */
export const determineRequestedPdfType = (query: string): string | null => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('prescription') || lowerQuery.includes('medicine')) {
    return 'prescription';
  } else if (lowerQuery.includes('health plan') || lowerQuery.includes('diet') || lowerQuery.includes('exercise')) {
    return 'health_plan';
  } else if (lowerQuery.includes('medical report') || lowerQuery.includes('lab') || lowerQuery.includes('test results')) {
    return 'medical_report';
  } else if (lowerQuery.includes('invoice') || lowerQuery.includes('bill') || lowerQuery.includes('payment')) {
    return 'invoice';
  }
  
  return null;
};

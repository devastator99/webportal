
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
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    await html2pdf().set(options).from(element).save();
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Generates a PDF preview in a new browser tab
 * @param elementId - The ID of the HTML element to convert to PDF
 * @returns Promise that resolves when the PDF has been generated
 */
export const previewPdf = async (elementId: string): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }
    
    const options = {
      margin: 10,
      filename: 'preview.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      outputPdf: 'dataurlstring'
    };
    
    const pdf = await html2pdf().set(options).from(element).output();
    
    // Open the PDF in a new tab
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <iframe width='100%' height='100%' src='${pdf}'></iframe>
      `);
    }
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    throw error;
  }
};

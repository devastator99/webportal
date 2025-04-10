
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { X, Download, Printer } from "lucide-react";

interface InvoicePdfViewerProps {
  invoiceId: string | null;
  isOpen: boolean;
  onClose: () => void;
  invoiceData?: {
    invoiceNumber: string;
    patientName: string;
    amount: number;
    date: string;
    description: string;
    status: string;
  };
  isLoading?: boolean;
}

export const InvoicePdfViewer: React.FC<InvoicePdfViewerProps> = ({
  invoiceId,
  isOpen,
  onClose,
  invoiceData,
  isLoading = false
}) => {
  const handlePrint = () => {
    const iframe = document.getElementById('invoice-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    }
  };
  
  const handleDownload = () => {
    const iframe = document.getElementById('invoice-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      // Create a temporary link to download the PDF
      const a = document.createElement('a');
      a.href = `data:application/pdf;base64,${invoiceData?.invoiceNumber}`;
      a.download = `Invoice-${invoiceData?.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Invoice #{invoiceData?.invoiceNumber}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        <div className="flex-1 border rounded-md overflow-hidden bg-white">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : invoiceId ? (
            <iframe 
              id="invoice-iframe"
              src={`/api/view-invoice/${invoiceId}`}
              className="w-full h-full border-0"
              title="Invoice Preview"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              No invoice selected
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

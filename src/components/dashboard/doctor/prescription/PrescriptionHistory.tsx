
import React, { useState, useRef } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer, FileText, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PrescriptionPrintTemplate } from "./PrescriptionPrintTemplate";
import { useToast } from "@/hooks/use-toast";

interface MedicalRecord {
  id: string;
  created_at: string;
  diagnosis: string | null;
  prescription: string | null;
  notes: string | null;
  doctor_id: string;
  patient_id: string;
  doctor_first_name: string | null;
  doctor_last_name: string | null;
  patient_first_name?: string | null;
  patient_last_name?: string | null;
}

interface PrescriptionHistoryProps {
  prescriptions: MedicalRecord[] | undefined;
}

export const PrescriptionHistory = ({ prescriptions }: PrescriptionHistoryProps) => {
  const [selectedPrescription, setSelectedPrescription] = useState<MedicalRecord | null>(null);
  const prescriptionRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No prescriptions found for this patient by you
      </div>
    );
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Could not open print window. Please check your popup settings.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPrescription) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Prescription</title>
          <style>
            body {
              font-family: serif;
              padding: 40px;
              max-width: 210mm;
              margin: 0 auto;
            }
            .header {
              border-bottom: 2px solid #ccc;
              padding-bottom: 20px;
              margin-bottom: 20px;
              text-align: center;
            }
            .hospital-name {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
            }
            .doctor-info {
              margin-top: 10px;
              display: flex;
              justify-content: space-between;
            }
            .patient-info {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              text-decoration: underline;
              margin-bottom: 10px;
            }
            .section {
              margin-bottom: 20px;
              white-space: pre-wrap;
            }
            .rx-symbol {
              font-size: 24px;
              margin-bottom: 20px;
            }
            .footer {
              margin-top: 60px;
              border-top: 2px solid #ccc;
              padding-top: 20px;
              display: flex;
              justify-content: space-between;
            }
            .signature {
              border-top: 2px solid #000;
              display: inline-block;
              padding-top: 5px;
              width: 200px;
              text-align: center;
              margin-top: 40px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hospital-name">MedCare Hospital</div>
            <div class="doctor-info">
              <div>
                <p>Dr. ${selectedPrescription.doctor_first_name} ${selectedPrescription.doctor_last_name}</p>
                <p style="color: #666; font-size: 14px;">Medical License #: ML-12345</p>
              </div>
              <div style="text-align: right;">
                <p style="font-weight: bold;">Date:</p>
                <p>${format(new Date(selectedPrescription.created_at), 'dd/MM/yyyy')}</p>
              </div>
            </div>
          </div>

          <div class="patient-info">
            <p><span style="font-weight: bold;">Patient Name:</span> ${selectedPrescription.patient_first_name || ''} ${selectedPrescription.patient_last_name || ''}</p>
            <p><span style="font-weight: bold;">Date:</span> ${format(new Date(selectedPrescription.created_at), 'dd MMMM yyyy')}</p>
          </div>

          <div class="rx-symbol">
            &#8478;
          </div>

          <div class="section">
            <div class="section-title">Diagnosis</div>
            <p>${selectedPrescription.diagnosis || ''}</p>
          </div>

          <div class="section">
            <div class="section-title">Prescription</div>
            <p>${selectedPrescription.prescription || ''}</p>
          </div>

          ${selectedPrescription.notes ? `
            <div class="section">
              <div class="section-title">Notes</div>
              <p>${selectedPrescription.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <div>
              <p style="font-size: 14px; color: #666;">
                MedCare Hospital, Medical Center
              </p>
              <p style="font-size: 14px; color: #666;">
                123 Health Street, Medical District
              </p>
              <p style="font-size: 14px; color: #666;">
                Phone: (123) 456-7890
              </p>
            </div>
            <div style="text-align: right;">
              <div class="signature">
                <p>Doctor's Signature</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
    };
  };

  const generatePDF = async () => {
    try {
      // This is a simpler approach that relies on the browser's print-to-PDF functionality
      handlePrint();
      
      toast({
        title: "PDF Generation",
        description: "Use your browser's print dialog to save as PDF",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Prescription</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescriptions.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{format(new Date(record.created_at), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{record.diagnosis}</TableCell>
                <TableCell className="max-w-md whitespace-pre-wrap break-words">{record.prescription}</TableCell>
                <TableCell className="max-w-xs whitespace-pre-wrap break-words">{record.notes || "-"}</TableCell>
                <TableCell>
                  {`${record.doctor_first_name || 'Unknown'} ${record.doctor_last_name || ''}`}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedPrescription(record);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedPrescription(record);
                        setTimeout(handlePrint, 100);
                      }}
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Print
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedPrescription(record);
                        setTimeout(generatePDF, 100);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Prescription View Dialog */}
      <Dialog 
        open={!!selectedPrescription} 
        onOpenChange={(open) => {
          if (!open) setSelectedPrescription(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>
          
          {selectedPrescription && (
            <div className="mt-4">
              <PrescriptionPrintTemplate 
                prescription={selectedPrescription} 
                ref={prescriptionRef}
              />
              
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="default"
                  onClick={generatePDF}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

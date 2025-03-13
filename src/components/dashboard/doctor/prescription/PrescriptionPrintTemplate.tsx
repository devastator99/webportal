
import React from "react";
import { format } from "date-fns";

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

interface PrescriptionPrintTemplateProps {
  prescription: MedicalRecord;
  hospitalName?: string;
}

export const PrescriptionPrintTemplate = React.forwardRef<HTMLDivElement, PrescriptionPrintTemplateProps>(
  ({ prescription, hospitalName = "MedCare Hospital" }, ref) => {
    return (
      <div 
        ref={ref} 
        className="w-full max-w-3xl mx-auto bg-white p-8 font-serif"
        style={{ minHeight: "297mm", width: "210mm" }}
      >
        {/* Header */}
        <div className="border-b-2 border-gray-300 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-center text-blue-800">{hospitalName}</h1>
          <div className="flex justify-between mt-2">
            <div>
              <p>Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}</p>
              <p className="text-gray-600 text-sm">Medical License #: ML-12345</p>
            </div>
            <div className="text-right">
              <p className="font-bold">Date:</p>
              <p>{format(new Date(prescription.created_at), 'dd/MM/yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Patient Info */}
        <div className="mb-6">
          <p><span className="font-bold">Patient Name:</span> {prescription.patient_first_name} {prescription.patient_last_name}</p>
          <p><span className="font-bold">Date:</span> {format(new Date(prescription.created_at), 'dd MMMM yyyy')}</p>
        </div>

        {/* Rx Symbol */}
        <div className="mb-6">
          <span className="text-2xl">&#8478;</span>
        </div>

        {/* Diagnosis */}
        <div className="mb-6">
          <h2 className="text-lg font-bold underline mb-2">Diagnosis</h2>
          <p className="whitespace-pre-wrap">{prescription.diagnosis}</p>
        </div>

        {/* Prescription */}
        <div className="mb-6">
          <h2 className="text-lg font-bold underline mb-2">Prescription</h2>
          <div className="whitespace-pre-wrap">{prescription.prescription}</div>
        </div>

        {/* Notes */}
        {prescription.notes && (
          <div className="mb-10">
            <h2 className="text-lg font-bold underline mb-2">Notes</h2>
            <p className="whitespace-pre-wrap">{prescription.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto border-t-2 border-gray-300 pt-4">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {hospitalName}, Medical Center
              </p>
              <p className="text-sm text-gray-600">
                123 Health Street, Medical District
              </p>
              <p className="text-sm text-gray-600">
                Phone: (123) 456-7890
              </p>
            </div>
            <div className="text-right mt-6">
              <div className="border-t-2 border-black inline-block pt-1 w-48">
                <p className="text-center">Doctor's Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PrescriptionPrintTemplate.displayName = "PrescriptionPrintTemplate";


import React from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
}

interface PrescriptionHistoryProps {
  prescriptions: MedicalRecord[] | undefined;
}

export const PrescriptionHistory = ({ prescriptions }: PrescriptionHistoryProps) => {
  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No prescriptions found for this patient by you
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Diagnosis</TableHead>
            <TableHead>Prescription</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Doctor</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

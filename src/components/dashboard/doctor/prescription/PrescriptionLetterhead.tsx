
import React from "react";

interface HeaderInfo {
  clinicName: string;
  clinicAddress: string;
  clinicLocation: string;
  clinicCity: string;
  timings: string;
  days: string;
  appointmentNote: string;
  closedDays: string;
}

interface PrescriptionLetterheadProps {
  headerInfo: HeaderInfo;
}

export const PrescriptionLetterhead: React.FC<PrescriptionLetterheadProps> = ({ headerInfo }) => {
  return (
    <div className="border-b pb-4">
      <div className="flex flex-col md:flex-row justify-between">
        <div className="mb-4 md:mb-0">
          <h2 className="text-lg font-bold">Dr. Kumar Anuj</h2>
          <div className="text-sm text-gray-600">
            <p>M.D. (Medicine)</p>
            <p>D.M. (Endocrinology)</p>
            <p>B.M.C Reg. No.: 38088</p>
          </div>
          <div className="mt-2 text-gray-600 text-sm">
            <p>मधुमेहरोग, थायरायिड एवं हारमोन रोग विशेषज्ञ</p>
            <p><strong>For Appointment Contact</strong></p>
            <p>9507711498, 7255912789</p>
          </div>
        </div>
        
        <div className="text-right">
          <h2 className="text-lg font-bold">{headerInfo.clinicName}</h2>
          <div className="text-sm text-gray-600">
            <p>{headerInfo.clinicAddress}</p>
            <p>{headerInfo.clinicLocation}</p>
            <p>{headerInfo.clinicCity}</p>
          </div>
          <div className="mt-2 text-gray-600 text-sm">
            <p>Timing: {headerInfo.timings}</p>
            <p>{headerInfo.days} {headerInfo.closedDays}</p>
            <p>{headerInfo.appointmentNote}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 border-t pt-4">
        <div className="flex justify-between">
          <div className="text-sm">
            <p><strong>DTHC055668 : VIBHA DEVI (45y, Female)</strong> - 8676040033</p>
          </div>
          <div className="text-sm">
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>BP: <span className="font-medium">116/78 mmHg</span></div>
          <div>Height: <span className="font-medium">158 cm</span></div>
          <div>Weight: <span className="font-medium">71 kg</span></div>
          <div>BMI: <span className="font-medium">28.44 Kg/m²</span></div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          <p>
            [18-Mar-2025] Glycosylated Haemoglobin - HbA1c:7.8 Mean Blood Glucose (Calculated from HbA1c):175 
            Serum Creatinine:0.53 Serum Uric Acid:4.1 Serum Calcium:9.74 eGFR - Creatinine Clearance:116.16 TSH (Thyroid Stimulating Hormone):3.77 T3:112 T4:8.65
          </p>
        </div>
      </div>
    </div>
  );
};


import React from "react";
import { Separator } from "@/components/ui/separator";

interface PrescriptionFooterProps {
  validity?: number;
}

export const PrescriptionFooter: React.FC<PrescriptionFooterProps> = ({ validity = 30 }) => {
  return (
    <div className="mt-6 pt-4 border-t space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm">अगली तारीख: {validity} days</p>
        </div>
        <div className="text-right">
          <p className="font-bold">Dr. Kumar Anuj</p>
          <p className="text-xs">M.D.D.M</p>
          <p className="text-xs">DTHC an unit of Swami Vivekananda Integrative Health</p>
          <p className="text-xs">Services Pvt. Ltd.</p>
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-500">
        <p>Powered by HealthPlix EMR. www.healthplix.com</p>
      </div>
      
      <Separator />
      
      <div className="text-xs text-center text-gray-500">
        <p>मधुमेहरोग, थायरायिड की समस्या, मोटापा, इन्फर्टिलिटी, लम्बाई की समस्या एवं अस्थियों से जुड़े रोगो में निपुण</p>
        <p>Consult for expert opinion on diabetes, thyroid disorders, obesity, infertility, short stature, osteoporosis & other hormone related disorders.</p>
        <p className="font-bold">PRESCRIPTION VALID FOR {validity} DAYS</p>
      </div>
    </div>
  );
};

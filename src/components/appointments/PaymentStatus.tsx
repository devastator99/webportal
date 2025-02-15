
import { Check, Loader2, XCircle } from "lucide-react";

type PaymentStepState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success" }
  | { status: "error"; error: string };

interface PaymentStatusProps {
  paymentStep: PaymentStepState;
}

export const PaymentStatus = ({ paymentStep }: PaymentStatusProps) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      {paymentStep.status === "processing" && (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-lg">Processing payment...</p>
        </>
      )}
      {paymentStep.status === "success" && (
        <>
          <Check className="h-8 w-8 text-green-500" />
          <p className="text-lg">Payment successful!</p>
        </>
      )}
      {paymentStep.status === "error" && (
        <>
          <XCircle className="h-8 w-8 text-red-500" />
          <p className="text-lg text-red-500">{paymentStep.error}</p>
        </>
      )}
    </div>
  );
};


import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { CreditCard, Mail, Send, RefreshCw } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PatientPaymentSummary {
  patient_id: string;
  patient_first_name: string;
  patient_last_name: string;
  doctor_id: string | null;
  doctor_first_name: string | null;
  doctor_last_name: string | null;
  total_invoices: number;
  pending_payments: number;
  paid_amount: number;
}

interface NewInvoiceData {
  patientId: string;
  doctorId: string | null;
  amount: string;
  description: string;
}

export const PatientPaymentManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientPaymentSummary[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientPaymentSummary | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<NewInvoiceData>({
    patientId: "",
    doctorId: "",
    amount: "500",
    description: "Medical consultation fees"
  });
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchPatientPaymentData();
  }, []);
  
  // Clear dialog state when it closes
  useEffect(() => {
    if (!isInvoiceDialogOpen) {
      resetInvoiceData();
    }
  }, [isInvoiceDialogOpen]);
  
  const fetchPatientPaymentData = async () => {
    setLoading(true);
    try {
      // Use the edge function instead of direct RPC call
      const { data, error } = await supabase.functions.invoke('get-patient-payment-summary');
      
      if (error) {
        throw error;
      }
      
      console.log("Patient payment data:", data);
      setPatients(data as PatientPaymentSummary[]);
    } catch (error: any) {
      console.error("Error fetching patient payment data:", error);
      toast({
        title: "Error",
        description: `Failed to load patient payment data: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const resetInvoiceData = () => {
    if (selectedPatient) {
      setInvoiceData({
        patientId: selectedPatient.patient_id,
        doctorId: selectedPatient.doctor_id || "",
        amount: "500",
        description: "Medical consultation fees"
      });
    } else {
      setInvoiceData({
        patientId: "",
        doctorId: "",
        amount: "500",
        description: "Medical consultation fees"
      });
    }
  };
  
  const handleOpenInvoiceDialog = (patient: PatientPaymentSummary) => {
    setSelectedPatient(patient);
    setInvoiceData({
      patientId: patient.patient_id,
      doctorId: patient.doctor_id || "",
      amount: "500",
      description: "Medical consultation fees"
    });
    setIsInvoiceDialogOpen(true);
  };
  
  const handleOpenPaymentDialog = (patient: PatientPaymentSummary) => {
    setSelectedPatient(patient);
    setIsPaymentDialogOpen(true);
    setPaymentError(null);
  };
  
  const generateInvoice = async () => {
    setGeneratingInvoice(true);
    
    try {
      if (!invoiceData.patientId) {
        throw new Error("Patient ID is required");
      }
      
      if (!invoiceData.amount || isNaN(Number(invoiceData.amount)) || Number(invoiceData.amount) <= 0) {
        throw new Error("Please enter a valid amount");
      }
      
      // Use the edge function instead of direct RPC call
      const { data, error } = await supabase.functions.invoke('generate-patient-invoice', {
        body: {
          patientId: invoiceData.patientId,
          doctorId: invoiceData.doctorId || null,
          amount: Number(invoiceData.amount),
          description: invoiceData.description
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Refresh the patient payment data
      await fetchPatientPaymentData();
      
      toast({
        title: "Success",
        description: "Invoice generated successfully",
      });
      
      // Close the dialog
      setIsInvoiceDialogOpen(false);
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      toast({
        title: "Error",
        description: `Failed to generate invoice: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setGeneratingInvoice(false);
    }
  };
  
  const initiateRazorpayPayment = async () => {
    setProcessingPayment(true);
    setPaymentError(null);
    
    try {
      if (!selectedPatient) {
        throw new Error("No patient selected");
      }
      
      // Create a Razorpay order via edge function
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { 
          patient_id: selectedPatient.patient_id,
          patient_name: `${selectedPatient.patient_first_name} ${selectedPatient.patient_last_name}`,
          doctor_id: selectedPatient.doctor_id,
          amount: 500 * 100 // Convert to smallest currency unit (paise)
        }
      });
      
      if (error) {
        throw new Error(`Failed to create order: ${error.message}`);
      }
      
      if (!data || !data.id) {
        throw new Error("Failed to create payment order");
      }
      
      console.log("Razorpay order created:", data);
      
      // This would normally open the Razorpay payment dialog
      // For demo purposes, we'll just show an alert about where this would happen
      toast({
        title: "Payment Integration",
        description: "At this point, the Razorpay payment window would open with options for UPI/Card/Banking",
      });
      
      // Simulate a successful payment for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // This would be called after successful payment
      await handlePaymentSuccess({
        razorpay_payment_id: "pay_demo_" + Math.random().toString(36).substr(2, 9),
        razorpay_order_id: data.id,
        razorpay_signature: "signature_demo"
      });
      
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      setPaymentError(error.message);
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessingPayment(false);
    }
  };
  
  const handlePaymentSuccess = async (response: any) => {
    try {
      // Verify the payment on the server
      const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: { 
          ...response,
          patient_id: selectedPatient?.patient_id
        }
      });
      
      if (error) {
        throw new Error(`Payment verification failed: ${error.message}`);
      }
      
      // Refresh patient payment data
      await fetchPatientPaymentData();
      
      toast({
        title: "Payment Successful",
        description: "The payment has been processed successfully",
      });
      
      // Close the payment dialog
      setIsPaymentDialogOpen(false);
    } catch (error: any) {
      console.error("Payment verification error:", error);
      setPaymentError(error.message);
      toast({
        title: "Payment Verification Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const sendInvoiceNotification = async (patientId: string, channel: 'email' | 'whatsapp') => {
    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-notification', {
        body: { 
          patient_id: patientId,
          channel: channel
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Notification Sent",
        description: `Invoice notification sent via ${channel}`,
      });
      
      // Refresh data to update UI indicators
      await fetchPatientPaymentData();
    } catch (error: any) {
      console.error(`Error sending ${channel} notification:`, error);
      toast({
        title: "Notification Failed",
        description: `Failed to send ${channel} notification: ${error.message}`,
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">
          Manage patient payments and invoices
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPatientPaymentData}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      {loading ? (
        <div className="py-10 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border rounded-md shadow-sm">
          <ScrollArea className="w-full" orientation="horizontal">
            <div className="min-w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Patient</TableHead>
                    <TableHead className="min-w-[200px]">Assigned Doctor</TableHead>
                    <TableHead className="min-w-[150px]">Payment Status</TableHead>
                    <TableHead className="min-w-[280px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.length > 0 ? (
                    patients.map((patient) => (
                      <TableRow key={patient.patient_id}>
                        <TableCell className="font-medium">
                          {patient.patient_first_name} {patient.patient_last_name}
                        </TableCell>
                        <TableCell>
                          {patient.doctor_first_name ? (
                            `${patient.doctor_first_name} ${patient.doctor_last_name}`
                          ) : (
                            <Badge variant="outline" className="text-amber-500 bg-amber-50">
                              No Doctor Assigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {patient.pending_payments > 0 ? (
                            <Badge variant="outline" className="text-amber-500 bg-amber-50">
                              {patient.pending_payments} Pending
                            </Badge>
                          ) : patient.total_invoices > 0 ? (
                            <Badge variant="outline" className="text-green-500 bg-green-50">
                              All Paid
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500 bg-gray-50">
                              No Invoices
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenInvoiceDialog(patient)}
                            >
                              Generate Invoice
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleOpenPaymentDialog(patient)}
                              disabled={!patient.doctor_id}
                              className="bg-[#9b87f5] hover:bg-[#8a75e7]"
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Payment
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendInvoiceNotification(patient.patient_id, 'email')}
                              title="Send Email Notification"
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        No patients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      )}
      
      {/* Generate Invoice Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Create an invoice for {selectedPatient?.patient_first_name} {selectedPatient?.patient_last_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (INR)</Label>
              <Input
                id="amount"
                type="number"
                value={invoiceData.amount}
                onChange={e => setInvoiceData({...invoiceData, amount: e.target.value})}
                placeholder="Enter amount"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={invoiceData.description}
                onChange={e => setInvoiceData({...invoiceData, description: e.target.value})}
                placeholder="Enter invoice description"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={generateInvoice} 
              disabled={generatingInvoice}
              className="bg-[#9b87f5] hover:bg-[#8a75e7]"
            >
              {generatingInvoice ? "Generating..." : "Generate Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Process payment for {selectedPatient?.patient_first_name} {selectedPatient?.patient_last_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <Tabs defaultValue="razorpay" className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="razorpay">Razorpay</TabsTrigger>
              </TabsList>
              
              <TabsContent value="razorpay" className="space-y-4 mt-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Patient:</span>
                    <span className="text-sm font-medium">
                      {selectedPatient?.patient_first_name} {selectedPatient?.patient_last_name}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Doctor:</span>
                    <span className="text-sm font-medium">
                      {selectedPatient?.doctor_first_name ? 
                        `${selectedPatient?.doctor_first_name} ${selectedPatient?.doctor_last_name}` : 
                        "No doctor assigned"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Amount:</span>
                    <span className="text-sm font-medium">₹500.00</span>
                  </div>
                </div>
                
                {paymentError && (
                  <Alert variant="destructive">
                    <AlertDescription>{paymentError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={initiateRazorpayPayment}
                    disabled={processingPayment || !selectedPatient?.doctor_id}
                    className="bg-[#9b87f5] hover:bg-[#8a75e7]"
                  >
                    {processingPayment ? "Processing..." : "Pay with Razorpay"}
                  </Button>
                  
                  <div className="text-xs text-center text-gray-500 mt-2">
                    This will initiate payment with all options (UPI/Cards/Net Banking)
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

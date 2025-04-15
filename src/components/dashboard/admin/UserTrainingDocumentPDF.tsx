import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2pdf from "html2pdf.js";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export const UserTrainingDocumentPDF = () => {
  const { toast } = useToast();
  const [isViewOpen, setIsViewOpen] = useState(false);

  const handleDownloadPDF = () => {
    const element = document.getElementById('training-document');
    
    if (!element) {
      toast({
        title: "Error",
        description: "Document content not found",
        variant: "destructive",
      });
      return;
    }
    
    const opt = {
      margin: [10, 10, 10, 10],
      filename: 'HealthSync_User_Training_Document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    toast({
      title: "Generating PDF",
      description: "Please wait while we generate your document...",
    });
    
    // Generate PDF
    html2pdf().from(element).set(opt).save().then(() => {
      toast({
        title: "Success",
        description: "User training document downloaded successfully",
      });
    }).catch((error) => {
      console.error("PDF generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    });
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Click the button below to download a comprehensive training manual for all user roles 
          in the HealthSync system. The document includes test account credentials and detailed 
          instructions for each dashboard.
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <Button 
          onClick={() => setIsViewOpen(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          View Document
        </Button>
        
        <Button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
      
      {/* Document View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>HealthSync User Training Manual</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-grow">
            <div className="p-6">
              <div id="preview-document" className="prose max-w-none">
                <h1 className="text-3xl font-bold mb-6 text-center">HealthSync User Training Manual</h1>
                
                {/* Test Account Section */}
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-4">Test Account Credentials</h2>
                  <table className="w-full border-collapse mb-6">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border p-2 text-left">Role</th>
                        <th className="border p-2 text-left">Email</th>
                        <th className="border p-2 text-left">Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2">Administrator</td>
                        <td className="border p-2">admin@example.com</td>
                        <td className="border p-2">password123</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Doctor</td>
                        <td className="border p-2">doctor@example.com</td>
                        <td className="border p-2">password123</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Nutritionist</td>
                        <td className="border p-2">nutritionist@example.com</td>
                        <td className="border p-2">password123</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Patient</td>
                        <td className="border p-2">patient@example.com</td>
                        <td className="border p-2">password123</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Reception</td>
                        <td className="border p-2">reception@example.com</td>
                        <td className="border p-2">password123</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Administrator Dashboard Section - abbreviated version for preview */}
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-4">Administrator Dashboard</h2>
                  <p className="mb-4">
                    The Administrator Dashboard provides a comprehensive overview of the system and allows administrators to manage users, 
                    assign care teams, view reports, and configure system settings.
                  </p>
                  
                  {/* Preview only shows section headers */}
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">Main Dashboard</h3>
                    <div className="mb-2 p-4 bg-muted/20 border rounded text-center">
                      [Admin Dashboard Screenshot Preview]
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">User Management</h3>
                    <div className="mb-2 p-4 bg-muted/20 border rounded text-center">
                      [User Management Screenshot Preview]
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">Care Team Assignment</h3>
                    <div className="mb-2 p-4 bg-muted/20 border rounded text-center">
                      [Care Team Assignment Screenshot Preview]
                    </div>
                  </div>
                </div>
                
                {/* Other dashboard sections - abbreviated for preview */}
                <div className="my-6 text-center text-muted-foreground">
                  <p>— Preview abbreviated —</p>
                  <p>The full document contains detailed instructions for all user roles.</p>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Full PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Hidden content that will be converted to PDF */}
      <div id="training-document" className="hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">HealthSync User Training Manual</h1>
          
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Test Account Credentials</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Role</th>
                  <th className="border p-2 text-left">Email</th>
                  <th className="border p-2 text-left">Password</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">Administrator</td>
                  <td className="border p-2">admin@example.com</td>
                  <td className="border p-2">password123</td>
                </tr>
                <tr>
                  <td className="border p-2">Doctor</td>
                  <td className="border p-2">doctor@example.com</td>
                  <td className="border p-2">password123</td>
                </tr>
                <tr>
                  <td className="border p-2">Nutritionist</td>
                  <td className="border p-2">nutritionist@example.com</td>
                  <td className="border p-2">password123</td>
                </tr>
                <tr>
                  <td className="border p-2">Patient</td>
                  <td className="border p-2">patient@example.com</td>
                  <td className="border p-2">password123</td>
                </tr>
                <tr>
                  <td className="border p-2">Reception</td>
                  <td className="border p-2">reception@example.com</td>
                  <td className="border p-2">password123</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Administrative Dashboard Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Administrator Dashboard</h2>
            <p className="mb-4">
              The Administrator Dashboard provides a comprehensive overview of the system and allows administrators to manage users, 
              assign care teams, view reports, and configure system settings.
            </p>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Main Dashboard</h3>
              <div className="mb-2 border p-4 text-center">
                [Admin Dashboard Screenshot - Main Overview with Stats Cards]
              </div>
              <ul className="list-disc ml-6 mb-4">
                <li>View system statistics at the top of the dashboard</li>
                <li>Access different administrative functions through collapsible sections</li>
                <li>Manage user accounts and system settings</li>
              </ul>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">User Management</h3>
              <div className="mb-2 border p-4 text-center">
                [Admin Dashboard Screenshot - User Management Section]
              </div>
              <ul className="list-disc ml-6 mb-4">
                <li>View all users in the system</li>
                <li>Filter users by role or search by name/email</li>
                <li>Select and delete users as needed</li>
                <li>Register new users with specific roles</li>
              </ul>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Care Team Assignment</h3>
              <div className="mb-2 border p-4 text-center">
                [Admin Dashboard Screenshot - Patient Assignment Interface]
              </div>
              <ul className="list-disc ml-6 mb-4">
                <li>Assign patients to doctors and nutritionists</li>
                <li>View current assignments and make changes as needed</li>
                <li>Sync care teams to enable communication</li>
              </ul>
            </div>
          </div>
          
          {/* Doctor Dashboard Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Doctor Dashboard</h2>
            <p className="mb-4">
              The Doctor Dashboard allows healthcare providers to manage their patients, create prescriptions, communicate with the care team,
              and monitor patient progress.
            </p>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Main Dashboard</h3>
              <div className="mb-2 border p-4 text-center">
                [Doctor Dashboard Screenshot - Main Overview]
              </div>
              <ul className="list-disc ml-6 mb-4">
                <li>View today's appointments and recent patients</li>
                <li>Access quick links to common doctor tasks</li>
                <li>Monitor key performance indicators</li>
              </ul>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Prescription Writing</h3>
              <div className="mb-2 border p-4 text-center">
                [Doctor Dashboard Screenshot - Prescription Interface]
              </div>
              <ul className="list-disc ml-6 mb-4">
                <li>Create and manage patient prescriptions</li>
                <li>Select from medication database</li>
                <li>Add dosage instructions and duration</li>
                <li>Print or send prescriptions digitally</li>
              </ul>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Patient Communication</h3>
              <div className="mb-2 border p-4 text-center">
                [Doctor Dashboard Screenshot - Chat Interface]
              </div>
              <ul className="list-disc ml-6 mb-4">
                <li>Chat with patients and other care team members</li>
                <li>View conversation history</li>
                <li>Share documents and images</li>
              </ul>
            </div>
          </div>
          
          {/* Nutritionist Dashboard Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Nutritionist Dashboard</h2>
            <p className="mb-4">
              The Nutritionist Dashboard enables nutritionists to create personalized health plans for patients, track dietary progress,
              and communicate with the care team.
            </p>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Health Plan Creator</h3>
              <div className="mb-2 border p-4 text-center">
                [Nutritionist Dashboard Screenshot - Health Plan Creator]
              </div>
              <ul className="list-disc ml-6 mb-4">
                <li>Create personalized health plans with food, exercise, and medication components</li>
                <li>Set schedules and frequencies for each plan item</li>
                <li>Save and distribute plans to patients</li>
              </ul>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Patient Progress Tracking</h3>
              <div className="mb-2 border p-4 text-center">
                [Nutritionist Dashboard Screenshot - Patient Progress View]
              </div>
              <ul className="list-disc ml-6 mb-4">
                <li>Monitor patient adherence to health plans</li>
                <li>Track key health metrics over time</li>
                <li>Generate progress reports</li>
              </ul>
            </div>
          </div>
          
          {/* Patient Dashboard Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Patient Dashboard</h2>
            <p className="mb-4">
              The Patient Dashboard allows patients to view their health plans, track progress, communicate with their care team,
              and manage appointments.
            </p>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Health Plan View</h3>
              <div className="mb-2 border p-4 text-center">
                [Patient Dashboard Screenshot - Health Plan View]
              </div>
              <ul className="list-disc ml-6 mb-4">
                <li>View prescribed health plan with daily tasks</li>
                <li>Mark items as complete</li>
                <li>Track progress over time</li>
              </ul>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Appointment Management</h3>
              <div className="mb-2 border p-4 text-center">
                [Patient Dashboard Screenshot - Appointments View]
              </div>
              <ul className="list-disc ml-6 mb-4">
                <li>View upcoming appointments</li>
                <li>Schedule new appointments</li>
                <li>Receive reminders and notifications</li>
              </ul>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Care Team Communication</h3>
              <div className="mb-2 border p-4 text-center">
                [Patient Dashboard Screenshot - Chat Interface]
              </div>
              <ul className="list-disc ml-6 mb-4">
                <li>Chat with doctors, nutritionists, and other care team members</li>
                <li>Share progress updates and ask questions</li>
                <li>Receive guidance and feedback</li>
              </ul>
            </div>
          </div>
          
          {/* Reception Dashboard Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Reception Dashboard</h2>
            <p className="mb-4">
              The Reception Dashboard provides tools for front desk staff to manage appointments, patient check-ins,
              and administrative tasks.
            </p>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Appointment Management</h3>
              <div className="mb-2 border p-4 text-center">
                [Reception Dashboard Screenshot - Appointment Calendar]
              </div>
              <ul className="list-disc ml-6 mb-4">
                <li>View and manage the clinic's appointment schedule</li>
                <li>Book new appointments for patients</li>
                <li>Handle cancellations and reschedules</li>
              </ul>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Patient Check-In</h3>
              <div className="mb-2 border p-4 text-center">
                [Reception Dashboard Screenshot - Patient Check-In Interface]
              </div>
              <ul className="list-disc ml-6 mb-4">
                <li>Check in patients upon arrival</li>
                <li>Update patient contact information</li>
                <li>Notify doctors when patients are ready</li>
              </ul>
            </div>
          </div>
          
          {/* Common Features Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Common Features</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Navigation</h3>
              <div className="mb-2 border p-4 text-center">
                [Screenshot - Main Navigation]
              </div>
              <ul className="list-disc ml-6 mb-4">
                <li>Use the top navigation bar to access different sections</li>
                <li>Mobile users can use the bottom navigation menu</li>
                <li>Click on the HealthSync logo to return to your dashboard</li>
              </ul>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Notifications</h3>
              <div className="mb-2 border p-4 text-center">
                [Screenshot - Notification Bell and Panel]
              </div>
              <ul className="list-disc ml-6 mb-4">
                <li>Click the notification bell to view recent notifications</li>
                <li>Navigate to the Notifications page for a complete history</li>
                <li>Set notification preferences in your profile</li>
              </ul>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Account Management</h3>
              <div className="mb-2 border p-4 text-center">
                [Screenshot - Account Menu]
              </div>
              <ul className="list-disc ml-6 mb-4">
                <li>Click your name in the top right to access account options</li>
                <li>Update your profile information</li>
                <li>Sign out when finished</li>
              </ul>
            </div>
          </div>
          
          {/* Support Information */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Getting Support</h2>
            <p className="mb-4">
              If you encounter any issues or have questions about using the system, please contact support:
            </p>
            <ul className="list-disc ml-6 mb-4">
              <li>Email: support@healthsync.example.com</li>
              <li>Phone: (555) 123-4567</li>
              <li>Hours: Monday-Friday, 8:00 AM - 6:00 PM</li>
            </ul>
            <p>
              For urgent matters outside of regular business hours, please use the emergency contact
              information provided by your clinic.
            </p>
          </div>
          
          <div className="text-center text-sm text-gray-500 mt-8">
            <p>HealthSync User Training Document - Generated on {new Date().toLocaleDateString()}</p>
            <p>Version 1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

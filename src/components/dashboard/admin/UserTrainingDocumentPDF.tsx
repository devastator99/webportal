
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2pdf from "html2pdf.js";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type DocumentType = "userTraining" | "architecture" | "highLevel" | "lowLevel";

export const UserTrainingDocumentPDF = () => {
  const { toast } = useToast();
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [activeDocument, setActiveDocument] = useState<DocumentType>("userTraining");

  const handleDownloadPDF = (documentType: DocumentType) => {
    const elementId = `${documentType}-document`;
    const element = document.getElementById(elementId);
    
    if (!element) {
      toast({
        title: "Error",
        description: "Document content not found",
        variant: "destructive",
      });
      return;
    }
    
    let filename = 'HealthSync_Document.pdf';
    switch (documentType) {
      case "userTraining":
        filename = 'HealthSync_User_Training_Document.pdf';
        break;
      case "architecture":
        filename = 'HealthSync_Architecture_Diagram.pdf';
        break;
      case "highLevel":
        filename = 'HealthSync_High_Level_Design.pdf';
        break;
      case "lowLevel":
        filename = 'HealthSync_Low_Level_Design.pdf';
        break;
    }
    
    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
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
        description: `${getDocumentTitle(documentType)} downloaded successfully`,
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

  const getDocumentTitle = (documentType: DocumentType): string => {
    switch (documentType) {
      case "userTraining":
        return "User Training Manual";
      case "architecture":
        return "Architecture Diagram";
      case "highLevel":
        return "High Level Design Document";
      case "lowLevel":
        return "Low Level Design Document";
      default:
        return "Document";
    }
  };

  const handleViewDocument = (documentType: DocumentType) => {
    setActiveDocument(documentType);
    setIsViewOpen(true);
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Technical documentation for the HealthSync system. View or download comprehensive documents including user training manuals, 
          architecture diagrams, and design specifications.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium">User Training Manual</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Comprehensive training documentation for all user roles with test credentials and dashboard instructions.
          </p>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => handleViewDocument("userTraining")}
              variant="outline"
              className="flex items-center gap-2"
              size="sm"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
            
            <Button 
              onClick={() => handleDownloadPDF("userTraining")}
              className="flex items-center gap-2"
              size="sm"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-green-500" />
            <h3 className="font-medium">Architecture Diagram</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            System architecture diagrams with component relationships, data flow, and integration points.
          </p>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => handleViewDocument("architecture")}
              variant="outline"
              className="flex items-center gap-2"
              size="sm"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
            
            <Button 
              onClick={() => handleDownloadPDF("architecture")}
              className="flex items-center gap-2"
              size="sm"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-purple-500" />
            <h3 className="font-medium">High Level Design</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            High-level system design with modules, interactions, API endpoints, and data models.
          </p>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => handleViewDocument("highLevel")}
              variant="outline"
              className="flex items-center gap-2"
              size="sm"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
            
            <Button 
              onClick={() => handleDownloadPDF("highLevel")}
              className="flex items-center gap-2"
              size="sm"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-orange-500" />
            <h3 className="font-medium">Low Level Design</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Detailed technical specifications including database schemas, webhooks, edge functions, and component details.
          </p>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => handleViewDocument("lowLevel")}
              variant="outline"
              className="flex items-center gap-2"
              size="sm"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
            
            <Button 
              onClick={() => handleDownloadPDF("lowLevel")}
              className="flex items-center gap-2"
              size="sm"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>
      
      {/* Document View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>HealthSync {getDocumentTitle(activeDocument)}</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue={activeDocument} value={activeDocument} onValueChange={(value) => setActiveDocument(value as DocumentType)} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="userTraining">User Training</TabsTrigger>
              <TabsTrigger value="architecture">Architecture</TabsTrigger>
              <TabsTrigger value="highLevel">High Level Design</TabsTrigger>
              <TabsTrigger value="lowLevel">Low Level Design</TabsTrigger>
            </TabsList>
            
            <TabsContent value="userTraining" className="flex-grow">
              <ScrollArea className="flex-grow h-[calc(90vh-180px)]">
                <div className="p-6">
                  {/* Using the actual document content directly for preview */}
                  <div id="userTraining-document-display" className="prose max-w-none">
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
                    
                    {/* Administrator Dashboard Section */}
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4">Administrator Dashboard</h2>
                      <p className="mb-4">
                        The Administrator Dashboard provides a comprehensive overview of the system and allows administrators to manage users, 
                        assign care teams, view reports, and configure system settings.
                      </p>
                      
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold mb-2">Main Dashboard</h3>
                        <div className="mb-2 p-4 bg-muted/20 border rounded text-center">
                          [Admin Dashboard Screenshot Preview]
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold mb-2">User Management</h3>
                        <p className="mb-2">
                          The User Management section allows administrators to:
                        </p>
                        <ul className="list-disc ml-6">
                          <li>View all registered users</li>
                          <li>Create new user accounts</li>
                          <li>Assign roles to users (doctor, patient, nutritionist, etc.)</li>
                          <li>Edit user profiles and contact information</li>
                        </ul>
                      </div>
                    </div>
                    
                    {/* Doctor Dashboard Section */}
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4">Doctor Dashboard</h2>
                      <p className="mb-4">
                        The Doctor Dashboard provides tools for managing patient care, writing prescriptions,
                        viewing medical reports, and scheduling appointments.
                      </p>
                      
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold mb-2">Key Features</h3>
                        <ul className="list-disc ml-6">
                          <li>Patient list with health summaries</li>
                          <li>Prescription writing interface</li>
                          <li>Appointment calendar</li>
                          <li>Medical document analysis</li>
                          <li>Care team chat functionality</li>
                        </ul>
                      </div>
                    </div>
                    
                    {/* Patient Dashboard Section */}
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4">Patient Dashboard</h2>
                      <p className="mb-4">
                        The Patient Dashboard allows patients to view their health records, prescriptions,
                        appointments, and communicate with their care team.
                      </p>
                      
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold mb-2">Key Features</h3>
                        <ul className="list-disc ml-6">
                          <li>Health plan summary</li>
                          <li>Prescription history</li>
                          <li>Medical records upload</li>
                          <li>Appointment booking</li>
                          <li>Care team messaging</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="architecture" className="flex-grow">
              <ScrollArea className="flex-grow h-[calc(90vh-180px)]">
                <div className="p-6">
                  {/* Using the actual document content directly for preview */}
                  <div id="architecture-document-display" className="prose max-w-none">
                    <h1 className="text-3xl font-bold mb-6 text-center">HealthSync Architecture Diagram</h1>
                    
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4">System Overview</h2>
                      <div className="mb-4 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                        <p className="text-gray-500 mb-2">System Architecture Diagram</p>
                        <div className="w-full h-64 bg-white border flex items-center justify-center">
                          <div className="text-center p-4">
                            <div className="border-2 border-blue-500 rounded-md p-3 mb-3 inline-block">
                              <p className="font-bold">Frontend</p>
                              <p className="text-sm">React + Vite + TypeScript</p>
                            </div>
                            <div className="flex justify-center">
                              <div className="border-t-2 border-gray-400 w-8"></div>
                              <div className="border-2 border-gray-400 rounded-full px-2 mx-1 text-xs">API</div>
                              <div className="border-t-2 border-gray-400 w-8"></div>
                            </div>
                            <div className="border-2 border-green-500 rounded-md p-3 mt-3 inline-block">
                              <p className="font-bold">Backend</p>
                              <p className="text-sm">Supabase (PostgreSQL + Auth + Storage)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="mb-4">
                        The HealthSync system uses a modern architecture with a React frontend and Supabase backend. The system is designed to be scalable, 
                        secure, and maintainable.
                      </p>
                    </div>
                    
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4">Technology Stack</h2>
                      <table className="w-full border-collapse mb-6">
                        <thead>
                          <tr className="bg-muted">
                            <th className="border p-2 text-left">Component</th>
                            <th className="border p-2 text-left">Technology</th>
                            <th className="border p-2 text-left">Purpose</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border p-2">Frontend</td>
                            <td className="border p-2">React, TypeScript, Vite</td>
                            <td className="border p-2">User interface and client-side logic</td>
                          </tr>
                          <tr>
                            <td className="border p-2">UI Components</td>
                            <td className="border p-2">Shadcn UI, Tailwind CSS</td>
                            <td className="border p-2">Consistent UI components and styling</td>
                          </tr>
                          <tr>
                            <td className="border p-2">State Management</td>
                            <td className="border p-2">React Query, Context API</td>
                            <td className="border p-2">Data fetching and global state</td>
                          </tr>
                          <tr>
                            <td className="border p-2">Backend</td>
                            <td className="border p-2">Supabase</td>
                            <td className="border p-2">Authentication, database, storage</td>
                          </tr>
                          <tr>
                            <td className="border p-2">Database</td>
                            <td className="border p-2">PostgreSQL</td>
                            <td className="border p-2">Data persistence</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4">System Layers</h2>
                      <p className="mb-4">The application is organized into the following architectural layers:</p>
                      <ol className="list-decimal ml-6">
                        <li className="mb-2">
                          <strong>Presentation Layer:</strong> React components, Shadcn UI, responsive layouts
                        </li>
                        <li className="mb-2">
                          <strong>Application Layer:</strong> React hooks, context providers, API clients
                        </li>
                        <li className="mb-2">
                          <strong>Data Access Layer:</strong> Supabase client integrations, React Query
                        </li>
                        <li className="mb-2">
                          <strong>Backend Services:</strong> Supabase functions, webhooks, authentication
                        </li>
                        <li className="mb-2">
                          <strong>Database Layer:</strong> PostgreSQL tables, views, functions
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="highLevel" className="flex-grow">
              <ScrollArea className="flex-grow h-[calc(90vh-180px)]">
                <div className="p-6">
                  {/* Using the actual document content directly for preview */}
                  <div id="highLevel-document-display" className="prose max-w-none">
                    <h1 className="text-3xl font-bold mb-6 text-center">HealthSync High Level Design</h1>
                    
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4">System Components</h2>
                      <div className="mb-6 overflow-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="border p-2 text-left">Component</th>
                              <th className="border p-2 text-left">Description</th>
                              <th className="border p-2 text-left">Responsibilities</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border p-2">Authentication Module</td>
                              <td className="border p-2">Handles user authentication and authorization</td>
                              <td className="border p-2">Login, signup, role-based access control</td>
                            </tr>
                            <tr>
                              <td className="border p-2">Dashboard Module</td>
                              <td className="border p-2">User dashboards for different roles</td>
                              <td className="border p-2">Display relevant information and actions for each user role</td>
                            </tr>
                            <tr>
                              <td className="border p-2">Patient Management</td>
                              <td className="border p-2">Patient records and care</td>
                              <td className="border p-2">Medical records, prescriptions, health plans</td>
                            </tr>
                            <tr>
                              <td className="border p-2">Appointment System</td>
                              <td className="border p-2">Schedule and manage appointments</td>
                              <td className="border p-2">Booking, notifications, reminders</td>
                            </tr>
                            <tr>
                              <td className="border p-2">Communication</td>
                              <td className="border p-2">Internal messaging system</td>
                              <td className="border p-2">Chat, notifications, care team coordination</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4">Data Flow Diagram</h2>
                      <div className="mb-4 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                        <p className="text-gray-500 mb-2">High-Level Data Flow</p>
                        <div className="w-full h-48 bg-white border flex items-center justify-center">
                          <p className="text-gray-400">Placeholder for data flow diagram</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4">API Endpoints Overview</h2>
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-2">Authentication APIs</h3>
                        <ul className="list-disc ml-6 mb-4">
                          <li>POST /auth/signin - User login</li>
                          <li>POST /auth/signup - New user registration</li>
                          <li>POST /auth/signout - User logout</li>
                        </ul>
                        
                        <h3 className="text-xl font-semibold mb-2">Patient APIs</h3>
                        <ul className="list-disc ml-6 mb-4">
                          <li>GET /patients - List patients</li>
                          <li>GET /patients/:id - Get patient details</li>
                          <li>POST /patients - Create patient</li>
                        </ul>
                        
                        <h3 className="text-xl font-semibold mb-2">Appointment APIs</h3>
                        <ul className="list-disc ml-6 mb-4">
                          <li>GET /appointments - List appointments</li>
                          <li>POST /appointments - Create appointment</li>
                          <li>PATCH /appointments/:id - Update appointment</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4">Integration Points</h2>
                      <p className="mb-4">The system integrates with the following external services:</p>
                      <ul className="list-disc ml-6">
                        <li className="mb-2">
                          <strong>Payment Gateway:</strong> Razorpay for processing appointment payments
                        </li>
                        <li className="mb-2">
                          <strong>AI Services:</strong> For medical document analysis and summaries
                        </li>
                        <li className="mb-2">
                          <strong>Notification Services:</strong> Email and push notification delivery
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="lowLevel" className="flex-grow">
              <ScrollArea className="flex-grow h-[calc(90vh-180px)]">
                <div className="p-6">
                  {/* Using the actual document content directly for preview */}
                  <div id="lowLevel-document-display" className="prose max-w-none">
                    <h1 className="text-3xl font-bold mb-6 text-center">HealthSync Low Level Design</h1>
                    
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4">Database Schema</h2>
                      <div className="mb-6 overflow-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="border p-2 text-left">Table Name</th>
                              <th className="border p-2 text-left">Primary Key</th>
                              <th className="border p-2 text-left">Description</th>
                              <th className="border p-2 text-left">Key Columns</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border p-2">profiles</td>
                              <td className="border p-2">id (uuid)</td>
                              <td className="border p-2">User profiles</td>
                              <td className="border p-2">id, first_name, last_name, specialty</td>
                            </tr>
                            <tr>
                              <td className="border p-2">user_roles</td>
                              <td className="border p-2">id (uuid)</td>
                              <td className="border p-2">User role assignments</td>
                              <td className="border p-2">user_id, role</td>
                            </tr>
                            <tr>
                              <td className="border p-2">appointments</td>
                              <td className="border p-2">id (uuid)</td>
                              <td className="border p-2">Patient appointments</td>
                              <td className="border p-2">patient_id, doctor_id, scheduled_at, status</td>
                            </tr>
                            <tr>
                              <td className="border p-2">medical_records</td>
                              <td className="border p-2">id (uuid)</td>
                              <td className="border p-2">Patient medical records</td>
                              <td className="border p-2">patient_id, doctor_id, diagnosis, prescription</td>
                            </tr>
                            <tr>
                              <td className="border p-2">health_plan_items</td>
                              <td className="border p-2">id (uuid)</td>
                              <td className="border p-2">Patient health plan items</td>
                              <td className="border p-2">patient_id, type, description, frequency</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4">Edge Functions</h2>
                      <div className="mb-6">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="border p-2 text-left">Function Name</th>
                              <th className="border p-2 text-left">Purpose</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border p-2">admin-assign-care-team</td>
                              <td className="border p-2">Assigns doctor and nutritionist to a patient</td>
                            </tr>
                            <tr>
                              <td className="border p-2">send-push-notification</td>
                              <td className="border p-2">Sends push notifications to user devices</td>
                            </tr>
                            <tr>
                              <td className="border p-2">analyze-medical-document</td>
                              <td className="border p-2">Analyzes uploaded medical documents with AI</td>
                            </tr>
                            <tr>
                              <td className="border p-2">create-razorpay-order</td>
                              <td className="border p-2">Creates payment orders in Razorpay</td>
                            </tr>
                            <tr>
                              <td className="border p-2">verify-razorpay-payment</td>
                              <td className="border p-2">Verifies payment status from Razorpay</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4">Webhooks</h2>
                      <div className="mb-6">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="border p-2 text-left">Webhook Path</th>
                              <th className="border p-2 text-left">Trigger</th>
                              <th className="border p-2 text-left">Purpose</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border p-2">/webhooks/razorpay</td>
                              <td className="border p-2">Payment status change</td>
                              <td className="border p-2">Update appointment payment status</td>
                            </tr>
                            <tr>
                              <td className="border p-2">/webhooks/notifications</td>
                              <td className="border p-2">App events</td>
                              <td className="border p-2">Trigger user notifications</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold mb-4">Security Implementations</h2>
                      <ul className="list-disc ml-6">
                        <li className="mb-2">
                          <strong>Authentication:</strong> JWT-based auth with refresh tokens
                        </li>
                        <li className="mb-2">
                          <strong>Authorization:</strong> Row-level security policies in PostgreSQL
                        </li>
                        <li className="mb-2">
                          <strong>Encryption:</strong> TLS for data in transit, encryption at rest
                        </li>
                        <li className="mb-2">
                          <strong>API Security:</strong> Rate limiting, CORS policies
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button onClick={() => handleDownloadPDF(activeDocument)} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Full PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Hidden content that will be converted to PDF - Using the exact same content as in the preview */}
      <div id="userTraining-document" className="hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">HealthSync User Training Manual</h1>
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Test Account Credentials</h2>
            <table className="w-full border-collapse mb-6">
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

          {/* Administrator Dashboard Section */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Administrator Dashboard</h2>
            <p className="mb-4">
              The Administrator Dashboard provides a comprehensive overview of the system and 
              allows administrators to manage users, assign care teams, view reports, and configure system settings.
            </p>
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Main Dashboard</h3>
              <div className="mb-2 p-4 bg-muted/20 border rounded text-center">
                [Admin Dashboard Screenshot Preview]
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">User Management</h3>
              <p className="mb-2">
                The User Management section allows administrators to:
              </p>
              <ul className="list-disc ml-6">
                <li>View all registered users</li>
                <li>Create new user accounts</li>
                <li>Assign roles to users (doctor, patient, nutritionist, etc.)</li>
                <li>Edit user profiles and contact information</li>
              </ul>
            </div>
          </div>
          
          {/* Doctor Dashboard Section */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Doctor Dashboard</h2>
            <p className="mb-4">
              The Doctor Dashboard provides tools for managing patient care, writing prescriptions,
              viewing medical reports, and scheduling appointments.
            </p>
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Key Features</h3>
              <ul className="list-disc ml-6">
                <li>Patient list with health summaries</li>
                <li>Prescription writing interface</li>
                <li>Appointment calendar</li>
                <li>Medical document analysis</li>
                <li>Care team chat functionality</li>
              </ul>
            </div>
          </div>
          
          {/* Patient Dashboard Section */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Patient Dashboard</h2>
            <p className="mb-4">
              The Patient Dashboard allows patients to view their health records, prescriptions,
              appointments, and communicate with their care team.
            </p>
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Key Features</h3>
              <ul className="list-disc ml-6">
                <li>Health plan summary</li>
                <li>Prescription history</li>
                <li>Medical records upload</li>
                <li>Appointment booking</li>
                <li>Care team messaging</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Architecture Document */}
      <div id="architecture-document" className="hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">HealthSync Architecture Diagram</h1>
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">System Overview</h2>
            <div className="mb-4 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
              <p className="text-gray-500 mb-2">System Architecture Diagram</p>
              <div className="w-full h-64 bg-white border flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="border-2 border-blue-500 rounded-md p-3 mb-3 inline-block">
                    <p className="font-bold">Frontend</p>
                    <p className="text-sm">React + Vite + TypeScript</p>
                  </div>
                  <div className="flex justify-center">
                    <div className="border-t-2 border-gray-400 w-8"></div>
                    <div className="border-2 border-gray-400 rounded-full px-2 mx-1 text-xs">API</div>
                    <div className="border-t-2 border-gray-400 w-8"></div>
                  </div>
                  <div className="border-2 border-green-500 rounded-md p-3 mt-3 inline-block">
                    <p className="font-bold">Backend</p>
                    <p className="text-sm">Supabase (PostgreSQL + Auth + Storage)</p>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="mb-4">
              The HealthSync system uses a modern architecture with a React frontend and Supabase backend.
              This document outlines the high-level architecture and component relationships.
            </p>
          </div>
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Technology Stack</h2>
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Component</th>
                  <th className="border p-2 text-left">Technology</th>
                  <th className="border p-2 text-left">Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">Frontend</td>
                  <td className="border p-2">React, TypeScript, Vite</td>
                  <td className="border p-2">User interface and client-side logic</td>
                </tr>
                <tr>
                  <td className="border p-2">UI Components</td>
                  <td className="border p-2">Shadcn UI, Tailwind CSS</td>
                  <td className="border p-2">Consistent UI components and styling</td>
                </tr>
                <tr>
                  <td className="border p-2">State Management</td>
                  <td className="border p-2">React Query, Context API</td>
                  <td className="border p-2">Data fetching and global state</td>
                </tr>
                <tr>
                  <td className="border p-2">Backend</td>
                  <td className="border p-2">Supabase</td>
                  <td className="border p-2">Authentication, database, storage</td>
                </tr>
                <tr>
                  <td className="border p-2">Database</td>
                  <td className="border p-2">PostgreSQL</td>
                  <td className="border p-2">Data persistence</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">System Layers</h2>
            <p className="mb-4">The application is organized into the following architectural layers:</p>
            <ol className="list-decimal ml-6">
              <li className="mb-2">
                <strong>Presentation Layer:</strong> React components, Shadcn UI, responsive layouts
              </li>
              <li className="mb-2">
                <strong>Application Layer:</strong> React hooks, context providers, API clients
              </li>
              <li className="mb-2">
                <strong>Data Access Layer:</strong> Supabase client integrations, React Query
              </li>
              <li className="mb-2">
                <strong>Backend Services:</strong> Supabase functions, webhooks, authentication
              </li>
              <li className="mb-2">
                <strong>Database Layer:</strong> PostgreSQL tables, views, functions
              </li>
            </ol>
          </div>
        </div>
      </div>
      
      {/* High Level Design Document */}
      <div id="highLevel-document" className="hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">HealthSync High Level Design</h1>
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">System Components</h2>
            <div className="mb-6 overflow-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Component</th>
                    <th className="border p-2 text-left">Description</th>
                    <th className="border p-2 text-left">Responsibilities</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Authentication Module</td>
                    <td className="border p-2">Handles user authentication and authorization</td>
                    <td className="border p-2">Login, signup, role-based access control</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Dashboard Module</td>
                    <td className="border p-2">User dashboards for different roles</td>
                    <td className="border p-2">Display relevant information and actions for each user role</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Patient Management</td>
                    <td className="border p-2">Patient records and care</td>
                    <td className="border p-2">Medical records, prescriptions, health plans</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Appointment System</td>
                    <td className="border p-2">Schedule and manage appointments</td>
                    <td className="border p-2">Booking, notifications, reminders</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Communication</td>
                    <td className="border p-2">Internal messaging system</td>
                    <td className="border p-2">Chat, notifications, care team coordination</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Data Flow Diagram</h2>
            <div className="mb-4 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
              <p className="text-gray-500 mb-2">High-Level Data Flow</p>
              <div className="w-full h-48 bg-white border flex items-center justify-center">
                <p className="text-gray-400">Placeholder for data flow diagram</p>
              </div>
            </div>
          </div>
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">API Endpoints Overview</h2>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Authentication APIs</h3>
              <ul className="list-disc ml-6 mb-4">
                <li>POST /auth/signin - User login</li>
                <li>POST /auth/signup - New user registration</li>
                <li>POST /auth/signout - User logout</li>
              </ul>
              
              <h3 className="text-xl font-semibold mb-2">Patient APIs</h3>
              <ul className="list-disc ml-6 mb-4">
                <li>GET /patients - List patients</li>
                <li>GET /patients/:id - Get patient details</li>
                <li>POST /patients - Create patient</li>
              </ul>
              
              <h3 className="text-xl font-semibold mb-2">Appointment APIs</h3>
              <ul className="list-disc ml-6 mb-4">
                <li>GET /appointments - List appointments</li>
                <li>POST /appointments - Create appointment</li>
                <li>PATCH /appointments/:id - Update appointment</li>
              </ul>
            </div>
          </div>
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Integration Points</h2>
            <p className="mb-4">The system integrates with the following external services:</p>
            <ul className="list-disc ml-6">
              <li className="mb-2">
                <strong>Payment Gateway:</strong> Razorpay for processing appointment payments
              </li>
              <li className="mb-2">
                <strong>AI Services:</strong> For medical document analysis and summaries
              </li>
              <li className="mb-2">
                <strong>Notification Services:</strong> Email and push notification delivery
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Low Level Design Document */}
      <div id="lowLevel-document" className="hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">HealthSync Low Level Design</h1>
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Database Schema</h2>
            <div className="mb-6 overflow-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Table Name</th>
                    <th className="border p-2 text-left">Primary Key</th>
                    <th className="border p-2 text-left">Description</th>
                    <th className="border p-2 text-left">Key Columns</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">profiles</td>
                    <td className="border p-2">id (uuid)</td>
                    <td className="border p-2">User profiles</td>
                    <td className="border p-2">id, first_name, last_name, specialty</td>
                  </tr>
                  <tr>
                    <td className="border p-2">user_roles</td>
                    <td className="border p-2">id (uuid)</td>
                    <td className="border p-2">User role assignments</td>
                    <td className="border p-2">user_id, role</td>
                  </tr>
                  <tr>
                    <td className="border p-2">appointments</td>
                    <td className="border p-2">id (uuid)</td>
                    <td className="border p-2">Patient appointments</td>
                    <td className="border p-2">patient_id, doctor_id, scheduled_at, status</td>
                  </tr>
                  <tr>
                    <td className="border p-2">medical_records</td>
                    <td className="border p-2">id (uuid)</td>
                    <td className="border p-2">Patient medical records</td>
                    <td className="border p-2">patient_id, doctor_id, diagnosis, prescription</td>
                  </tr>
                  <tr>
                    <td className="border p-2">health_plan_items</td>
                    <td className="border p-2">id (uuid)</td>
                    <td className="border p-2">Patient health plan items</td>
                    <td className="border p-2">patient_id, type, description, frequency</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Edge Functions</h2>
            <div className="mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Function Name</th>
                    <th className="border p-2 text-left">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">admin-assign-care-team</td>
                    <td className="border p-2">Assigns doctor and nutritionist to a patient</td>
                  </tr>
                  <tr>
                    <td className="border p-2">send-push-notification</td>
                    <td className="border p-2">Sends push notifications to user devices</td>
                  </tr>
                  <tr>
                    <td className="border p-2">analyze-medical-document</td>
                    <td className="border p-2">Analyzes uploaded medical documents with AI</td>
                  </tr>
                  <tr>
                    <td className="border p-2">create-razorpay-order</td>
                    <td className="border p-2">Creates payment orders in Razorpay</td>
                  </tr>
                  <tr>
                    <td className="border p-2">verify-razorpay-payment</td>
                    <td className="border p-2">Verifies payment status from Razorpay</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Webhooks</h2>
            <div className="mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Webhook Path</th>
                    <th className="border p-2 text-left">Trigger</th>
                    <th className="border p-2 text-left">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">/webhooks/razorpay</td>
                    <td className="border p-2">Payment status change</td>
                    <td className="border p-2">Update appointment payment status</td>
                  </tr>
                  <tr>
                    <td className="border p-2">/webhooks/notifications</td>
                    <td className="border p-2">App events</td>
                    <td className="border p-2">Trigger user notifications</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Security Implementations</h2>
            <ul className="list-disc ml-6">
              <li className="mb-2">
                <strong>Authentication:</strong> JWT-based auth with refresh tokens
              </li>
              <li className="mb-2">
                <strong>Authorization:</strong> Row-level security policies in PostgreSQL
              </li>
              <li className="mb-2">
                <strong>Encryption:</strong> TLS for data in transit, encryption at rest
              </li>
              <li className="mb-2">
                <strong>API Security:</strong> Rate limiting, CORS policies
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

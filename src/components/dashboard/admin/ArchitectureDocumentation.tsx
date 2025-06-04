
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MermaidDiagramRenderer } from './MermaidDiagramRenderer';
import { Search, FileDown, Architecture } from 'lucide-react';
import { toast } from 'sonner';

// Architecture diagrams data
const architectureDiagrams = {
  overview: {
    title: "Application Architecture Overview",
    description: "High-level view of the entire application structure with frontend, backend, and external integrations",
    diagram: `graph TB
    %% Frontend Layer
    subgraph "Frontend - React/TypeScript"
        LandingPage[Landing Page]
        AuthPages[Auth Pages]
        PatientDash[Patient Dashboard]
        DoctorDash[Doctor Dashboard]
        NutritionistDash[Nutritionist Dashboard]
        AdminDash[Admin Dashboard]
        ChatInterface[Chat Interface]
        HealthPlans[Health Plans]
        Prescriptions[Prescriptions]
        Appointments[Appointments]
    end

    %% Authentication Layer
    subgraph "Authentication"
        SupabaseAuth[Supabase Auth]
        UserRoles[User Roles System]
        RLS[Row Level Security]
    end

    %% Core Backend Services
    subgraph "Supabase Backend"
        Database[(PostgreSQL Database)]
        EdgeFunctions[Edge Functions]
        Storage[File Storage]
        Realtime[Realtime Subscriptions]
    end

    %% External Services
    subgraph "External Integrations"
        Razorpay[Razorpay Payments]
        Twilio[Twilio SMS/WhatsApp]
        OpenAI[OpenAI API]
        Bhashini[Bhashini Translation]
    end

    %% Data Flow
    LandingPage --> AuthPages
    AuthPages --> SupabaseAuth
    SupabaseAuth --> UserRoles
    UserRoles --> PatientDash
    UserRoles --> DoctorDash
    UserRoles --> NutritionistDash
    UserRoles --> AdminDash

    %% Dashboard Features
    PatientDash --> HealthPlans
    PatientDash --> ChatInterface
    PatientDash --> Appointments
    DoctorDash --> Prescriptions
    DoctorDash --> ChatInterface
    NutritionistDash --> HealthPlans
    AdminDash --> UserRoles

    %% Backend Connections
    ChatInterface --> EdgeFunctions
    HealthPlans --> Database
    Prescriptions --> Database
    Appointments --> Database
    EdgeFunctions --> Database
    EdgeFunctions --> Storage
    EdgeFunctions --> Razorpay
    EdgeFunctions --> Twilio
    EdgeFunctions --> OpenAI
    EdgeFunctions --> Bhashini

    %% Security Layer
    Database --> RLS
    EdgeFunctions --> RLS
    Storage --> RLS

    %% Styling
    classDef frontend fill:#e1f5fe
    classDef auth fill:#fff3e0
    classDef backend fill:#f3e5f5
    classDef external fill:#e8f5e8
    
    class LandingPage,AuthPages,PatientDash,DoctorDash,NutritionistDash,AdminDash,ChatInterface,HealthPlans,Prescriptions,Appointments frontend
    class SupabaseAuth,UserRoles,RLS auth
    class Database,EdgeFunctions,Storage,Realtime backend
    class Razorpay,Twilio,OpenAI,Bhashini external`
  },
  userFlow: {
    title: "User Flow and Modular Architecture",
    description: "Shows user types, core modules, database layers, and edge functions with their interconnections",
    diagram: `graph TB
    %% User Types and Authentication Flow
    subgraph "User Types & Authentication"
        Visitor[Website Visitor]
        Patient[Patient User]
        Doctor[Doctor User]
        Nutritionist[Nutritionist User]
        Admin[Admin User]
        
        Visitor --> Registration[Registration Process]
        Registration --> Payment[Payment Verification]
        Payment --> RoleAssignment[Role Assignment]
        RoleAssignment --> CareTeamSetup[Care Team Setup]
    end

    %% Core Application Modules
    subgraph "Core Modules"
        direction TB
        AuthModule[Authentication Module]
        ChatModule[Chat System]
        HealthModule[Health Management]
        PaymentModule[Payment System]
        NotificationModule[Notification System]
        AdminModule[Admin Management]
    end

    %% Database Architecture
    subgraph "Database Layer"
        UserTables[(User Tables)]
        HealthTables[(Health Data Tables)]
        ChatTables[(Chat Tables)]
        PaymentTables[(Payment Tables)]
        SystemTables[(System Tables)]
    end

    %% Edge Functions
    subgraph "Edge Functions Layer"
        AuthFunctions[Auth Functions]
        ChatFunctions[Chat Functions]
        HealthFunctions[Health Functions]
        PaymentFunctions[Payment Functions]
        NotificationFunctions[Notification Functions]
        AdminFunctions[Admin Functions]
    end

    %% External Services Integration
    subgraph "External Services"
        PaymentGateway[Razorpay]
        CommunicationAPI[Twilio]
        AIServices[OpenAI]
        TranslationAPI[Bhashini]
    end

    %% Flow Connections
    Patient --> ChatModule
    Patient --> HealthModule
    Patient --> PaymentModule
    
    Doctor --> ChatModule
    Doctor --> HealthModule
    Doctor --> AdminModule
    
    Nutritionist --> ChatModule
    Nutritionist --> HealthModule
    
    Admin --> AdminModule
    Admin --> PaymentModule
    Admin --> NotificationModule

    %% Module to Database Connections
    AuthModule --> UserTables
    ChatModule --> ChatTables
    HealthModule --> HealthTables
    PaymentModule --> PaymentTables
    AdminModule --> SystemTables

    %% Edge Functions Connections
    AuthModule --> AuthFunctions
    ChatModule --> ChatFunctions
    HealthModule --> HealthFunctions
    PaymentModule --> PaymentFunctions
    NotificationModule --> NotificationFunctions
    AdminModule --> AdminFunctions

    %% External Integration
    PaymentFunctions --> PaymentGateway
    NotificationFunctions --> CommunicationAPI
    ChatFunctions --> AIServices
    ChatFunctions --> TranslationAPI

    %% Styling
    classDef users fill:#e3f2fd
    classDef modules fill:#f1f8e9
    classDef database fill:#fff3e0
    classDef functions fill:#fce4ec
    classDef external fill:#e8f5e8
    
    class Visitor,Patient,Doctor,Nutritionist,Admin users
    class AuthModule,ChatModule,HealthModule,PaymentModule,NotificationModule,AdminModule modules
    class UserTables,HealthTables,ChatTables,PaymentTables,SystemTables database
    class AuthFunctions,ChatFunctions,HealthFunctions,PaymentFunctions,NotificationFunctions,AdminFunctions functions
    class PaymentGateway,CommunicationAPI,AIServices,TranslationAPI external`
  },
  dataFlow: {
    title: "Data Flow Architecture",
    description: "Illustrates the flow of data from client layer through API gateway to business logic and persistence layers",
    diagram: `graph LR
    %% Data Flow Architecture
    subgraph "Client Layer"
        WebApp[React Web App]
        Mobile[Mobile View]
    end

    subgraph "API Gateway"
        SupabaseAPI[Supabase API Gateway]
        EdgeRouter[Edge Function Router]
    end

    subgraph "Business Logic Layer"
        UserMgmt[User Management]
        HealthMgmt[Health Management]
        ChatMgmt[Chat Management]
        PaymentMgmt[Payment Management]
        NotificationMgmt[Notification Management]
    end

    subgraph "Data Persistence"
        PostgreSQL[(PostgreSQL)]
        FileStorage[(File Storage)]
        RealtimeDB[(Realtime DB)]
    end

    subgraph "External APIs"
        RazorpayAPI[Razorpay API]
        TwilioAPI[Twilio API]
        OpenAIAPI[OpenAI API]
        BhashiniAPI[Bhashini API]
    end

    %% Connections
    WebApp --> SupabaseAPI
    Mobile --> SupabaseAPI
    SupabaseAPI --> EdgeRouter
    
    EdgeRouter --> UserMgmt
    EdgeRouter --> HealthMgmt
    EdgeRouter --> ChatMgmt
    EdgeRouter --> PaymentMgmt
    EdgeRouter --> NotificationMgmt

    UserMgmt --> PostgreSQL
    HealthMgmt --> PostgreSQL
    ChatMgmt --> PostgreSQL
    ChatMgmt --> RealtimeDB
    PaymentMgmt --> PostgreSQL
    NotificationMgmt --> PostgreSQL

    HealthMgmt --> FileStorage
    ChatMgmt --> FileStorage

    PaymentMgmt --> RazorpayAPI
    NotificationMgmt --> TwilioAPI
    ChatMgmt --> OpenAIAPI
    ChatMgmt --> BhashiniAPI

    %% Styling
    classDef client fill:#e1f5fe
    classDef api fill:#fff3e0
    classDef business fill:#f3e5f5
    classDef data fill:#e8f5e8
    classDef external fill:#ffebee
    
    class WebApp,Mobile client
    class SupabaseAPI,EdgeRouter api
    class UserMgmt,HealthMgmt,ChatMgmt,PaymentMgmt,NotificationMgmt business
    class PostgreSQL,FileStorage,RealtimeDB data
    class RazorpayAPI,TwilioAPI,OpenAIAPI,BhashiniAPI external`
  }
};

export const ArchitectureDocumentation = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const handleExportAll = () => {
    toast.success("Exporting all diagrams...");
    // This would trigger downloads of all diagrams
    Object.entries(architectureDiagrams).forEach(([key, diagram]) => {
      setTimeout(() => {
        // Trigger download for each diagram
        console.log(`Exporting ${diagram.title}`);
      }, 100);
    });
  };

  const filteredDiagrams = Object.entries(architectureDiagrams).filter(([key, diagram]) =>
    diagram.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diagram.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search architecture diagrams..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleExportAll} className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          Export All Diagrams
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Architecture className="h-5 w-5" />
            System Architecture Documentation
          </CardTitle>
          <p className="text-muted-foreground">
            Comprehensive architecture diagrams showing the structure and data flow of the healthcare management system.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Application Overview</TabsTrigger>
              <TabsTrigger value="userFlow">User Flow & Modules</TabsTrigger>
              <TabsTrigger value="dataFlow">Data Flow</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <MermaidDiagramRenderer
                diagram={architectureDiagrams.overview.diagram}
                title={architectureDiagrams.overview.title}
                description={architectureDiagrams.overview.description}
              />
            </TabsContent>
            
            <TabsContent value="userFlow" className="mt-6">
              <MermaidDiagramRenderer
                diagram={architectureDiagrams.userFlow.diagram}
                title={architectureDiagrams.userFlow.title}
                description={architectureDiagrams.userFlow.description}
              />
            </TabsContent>
            
            <TabsContent value="dataFlow" className="mt-6">
              <MermaidDiagramRenderer
                diagram={architectureDiagrams.dataFlow.diagram}
                title={architectureDiagrams.dataFlow.title}
                description={architectureDiagrams.dataFlow.description}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {searchTerm && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">
            Search Results ({filteredDiagrams.length} found)
          </h3>
          <div className="space-y-4">
            {filteredDiagrams.map(([key, diagram]) => (
              <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setActiveTab(key)}>
                <CardContent className="p-4">
                  <h4 className="font-medium">{diagram.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{diagram.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type MedicalRecordsUploadProps = {
  showUploadOnly?: boolean;
};

export const MedicalRecordsUpload = ({ showUploadOnly = false }: MedicalRecordsUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    setIsUploading(true);
    
    try {
      // First create a medical record
      const { data: medicalRecord, error: recordError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: user.id,
          diagnosis: 'Uploaded by patient'
        })
        .select()
        .single();

      if (recordError) throw recordError;
      console.log('Created medical record:', medicalRecord);

      for (const file of files) {
        const filePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        
        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('medical_records')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        console.log('Uploaded file to storage:', filePath);

        // Create document record
        const { error: dbError } = await supabase
          .from('medical_documents')
          .insert({
            medical_record_id: medicalRecord.id,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size
          });

        if (dbError) {
          console.error('Error creating document record:', dbError);
          throw dbError;
        }
        console.log('Created document record for:', file.name);
      }

      toast({
        title: "Success",
        description: "Medical reports uploaded successfully",
      });

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload medical reports",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          Upload Medical Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        <Button 
          className="w-full" 
          variant="outline"
          onClick={handleButtonClick}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Choose Files"}
        </Button>
      </CardContent>
    </Card>
  );
};


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
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    setIsUploading(true);
    const newUploadedFiles: string[] = [];
    
    try {
      for (const file of files) {
        const filePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        
        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('patient_medical_reports')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create document record
        const { error: dbError } = await supabase
          .from('patient_medical_reports')
          .insert({
            patient_id: user.id,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size
          });

        if (dbError) {
          throw dbError;
        }
        
        newUploadedFiles.push(file.name);
      }

      setUploadedFiles(newUploadedFiles);
      
      toast({
        title: "Success",
        description: "Medical reports uploaded successfully",
      });

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
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
        
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Recently uploaded:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {uploadedFiles.map((file, index) => (
                <li key={index} className="truncate">
                  {file}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp } from "lucide-react";

type MedicalRecordsUploadProps = {
  showUploadOnly?: boolean;
};

export const MedicalRecordsUpload = ({ showUploadOnly = false }: MedicalRecordsUploadProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          Upload Medical Records
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button className="w-full" variant="outline">
          Choose Files
        </Button>
      </CardContent>
    </Card>
  );
};

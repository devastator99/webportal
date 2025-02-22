
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const DocumentAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsAnalyzing(true);
      setAnalysis(null);

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('medical_files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL of the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('medical_files')
        .getPublicUrl(filePath);

      // Analyze the document
      const { data: analysisData, error } = await supabase.functions.invoke('analyze-medical-document', {
        body: { fileUrl: publicUrl, fileType: file.type },
      });

      if (error) throw error;

      setAnalysis(analysisData.analysis);
      toast({
        title: "Analysis Complete",
        description: "The document has been successfully analyzed.",
      });

    } catch (error: any) {
      console.error('Error analyzing document:', error);
      toast({
        title: "Error",
        description: "Failed to analyze the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="document-upload"
            disabled={isAnalyzing}
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('document-upload')?.click()}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Upload Document or Image'
            )}
          </Button>

          {analysis && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Analysis Results:</h3>
              <div className="whitespace-pre-wrap text-sm">{analysis}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

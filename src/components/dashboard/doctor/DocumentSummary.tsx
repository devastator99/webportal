
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface AnalyzedDocument {
  id: string;
  original_filename: string;
  analysis_text: string;
  created_at: string;
  file_path: string;
}

export const DocumentAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: analyzedDocuments, refetch } = useQuery({
    queryKey: ["analyzed_documents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyzed_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AnalyzedDocument[];
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

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

      // Save the analysis to the database
      const { error: dbError } = await supabase
        .from('analyzed_documents')
        .insert({
          file_path: filePath,
          original_filename: file.name,
          file_type: file.type,
          file_size: file.size,
          analysis_text: analysisData.analysis,
          doctor_id: user.id
        });

      if (dbError) throw dbError;

      setAnalysis(analysisData.analysis);
      refetch(); // Refresh the list of analyzed documents

      toast({
        title: "Analysis Complete",
        description: "The document has been successfully analyzed and saved.",
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

  const viewDocument = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('medical_files')
        .createSignedUrl(filePath, 60); // URL valid for 60 seconds

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error accessing document:', error);
      toast({
        title: "Error",
        description: "Could not access the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Analysis
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            History
          </Button>
        </div>
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

        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Document Analysis History</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] w-full pr-4">
              <div className="space-y-4">
                {analyzedDocuments?.map((doc) => (
                  <Card key={doc.id} className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{doc.original_filename}</h4>
                        <p className="text-sm text-muted-foreground">
                          Analyzed on: {format(new Date(doc.created_at), "PPp")}
                        </p>
                        <div className="mt-2 text-sm">
                          <p className="font-medium">Analysis:</p>
                          <p className="whitespace-pre-wrap">{doc.analysis_text}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewDocument(doc.file_path)}
                      >
                        View Document
                      </Button>
                    </div>
                  </Card>
                ))}
                {!analyzedDocuments?.length && (
                  <p className="text-center text-muted-foreground py-4">
                    No analyzed documents yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};


import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface DocumentSummaryProps {
  documentId: string;
  documentPath: string;
}

export const DocumentSummary = ({ documentId, documentPath }: DocumentSummaryProps) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: summary, refetch } = useQuery({
    queryKey: ["document-summary", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_summaries")
        .select("summary")
        .eq("document_id", documentId)
        .single();

      if (error) throw error;
      return data?.summary;
    }
  });

  const analyzeMedicalDocument = async () => {
    try {
      setIsAnalyzing(true);
      
      const response = await fetch('/api/analyze-medical-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          documentId,
          documentUrl: documentPath
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze document');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      await refetch();
      
      toast({
        title: "Document analyzed",
        description: "The document summary has been generated successfully.",
      });
    } catch (error) {
      console.error('Error analyzing document:', error);
      toast({
        title: "Error analyzing document",
        description: error instanceof Error ? error.message : "An error occurred while analyzing the document.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Document Analysis</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={analyzeMedicalDocument}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
          ) : (
            <><RefreshCw className="mr-2 h-4 w-4" /> Analyze</>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {summary ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summary}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No analysis available. Click "Analyze" to generate a summary.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

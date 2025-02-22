
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const VideoUploader = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();

  const handleUpload = async () => {
    if (!file || !title || !user?.id || !userRole) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields and select a video file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('knowledge_videos')
        .insert({
          title,
          description,
          video_path: filePath,
          uploaded_by: user.id,
          uploader_role: userRole,
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });

      setTitle("");
      setDescription("");
      setFile(null);
      
      queryClient.invalidateQueries({ queryKey: ["knowledge_videos"] });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold">Upload Knowledge Sharing Video</h3>
      
      <Input
        type="text"
        placeholder="Video Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      
      <Textarea
        placeholder="Video Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      
      <Input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="cursor-pointer"
      />
      
      <Button
        onClick={handleUpload}
        disabled={uploading || !file || !title}
        className="w-full"
      >
        {uploading ? (
          "Uploading..."
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Video
          </>
        )}
      </Button>
    </div>
  );
};

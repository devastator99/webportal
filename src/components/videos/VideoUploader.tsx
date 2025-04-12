
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// Define the valid role types to match the database enum
type UserRoleType = "patient" | "doctor" | "nutritionist" | "administrator" | "reception" | "aibot";

export const VideoUploader = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();

  // Simple YouTube URL validation
  const isValidYoutubeUrl = (url: string) => {
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
    return ytRegex.test(url);
  };

  const handleUpload = async () => {
    if (!youtubeUrl || !title || !user?.id || !userRole) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields including a valid YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidYoutubeUrl(youtubeUrl)) {
      toast({
        title: "Invalid YouTube URL",
        description: "Please enter a valid YouTube video URL (e.g., https://youtube.com/watch?v=XXXXXXXXXXX or https://youtu.be/XXXXXXXXXXX).",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Cast userRole to the valid enum type
      const userRoleEnum = userRole as UserRoleType;
      
      const { error: dbError } = await supabase
        .from('knowledge_videos')
        .insert({
          title,
          description,
          video_path: youtubeUrl,
          uploaded_by: user.id,
          uploader_role: userRoleEnum,
          is_youtube: true
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "YouTube video added successfully!",
      });

      setTitle("");
      setDescription("");
      setYoutubeUrl("");
      
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
      <h3 className="text-lg font-semibold">Share YouTube Knowledge Video</h3>
      
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
        type="text"
        placeholder="YouTube URL (e.g., https://youtube.com/watch?v=XXXXXXXXXXX)"
        value={youtubeUrl}
        onChange={(e) => setYoutubeUrl(e.target.value)}
        className="cursor-text"
      />
      
      <Button
        onClick={handleUpload}
        disabled={uploading || !youtubeUrl || !title}
        className="w-full"
      >
        {uploading ? (
          "Submitting..."
        ) : (
          <>
            <Link className="mr-2 h-4 w-4" />
            Add YouTube Video
          </>
        )}
      </Button>
    </div>
  );
};

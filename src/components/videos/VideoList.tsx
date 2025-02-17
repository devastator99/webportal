
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoUploader } from "./VideoUploader";
import { useAuth } from "@/contexts/AuthContext";

export const VideoList = () => {
  const { user } = useAuth();
  const { data: videos, isLoading } = useQuery({
    queryKey: ["knowledge_videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        throw error;
      }
      console.log('Fetched videos:', data);
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        {user && <VideoUploader />}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg" />
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {user && <VideoUploader />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos?.map((video) => {
          const videoUrl = supabase.storage.from('videos').getPublicUrl(video.video_path).data.publicUrl;
          console.log('Video URL for', video.title, ':', videoUrl);
          console.log('Video path:', video.video_path);
          
          return (
            <Card key={video.id} className="overflow-hidden">
              <video
                className="w-full aspect-video object-cover"
                controls
                src={videoUrl}
                onError={(e) => console.error('Video loading error:', e)}
              />
              <CardHeader>
                <CardTitle>{video.title}</CardTitle>
                <CardDescription>
                  Educational Video
                </CardDescription>
              </CardHeader>
              {video.description && (
                <CardContent>
                  <p className="text-sm text-gray-500">{video.description}</p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

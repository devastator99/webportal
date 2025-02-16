
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const VideoList = () => {
  const { data: videos, isLoading } = useQuery({
    queryKey: ["knowledge_videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_videos')
        .select(`
          *,
          uploader:profiles!inner(
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos?.map((video) => (
        <Card key={video.id} className="overflow-hidden">
          <video
            className="w-full aspect-video object-cover"
            controls
            src={supabase.storage.from('videos').getPublicUrl(video.video_path).data.publicUrl}
          />
          <CardHeader>
            <CardTitle>{video.title}</CardTitle>
            <CardDescription>
              Uploaded by {video.uploader.first_name} {video.uploader.last_name}
            </CardDescription>
          </CardHeader>
          {video.description && (
            <CardContent>
              <p className="text-sm text-gray-500">{video.description}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

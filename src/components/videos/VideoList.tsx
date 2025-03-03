
import { useState, memo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Video {
  id: string;
  title: string;
  description: string;
  video_path: string;
  created_at: string;
  updated_at: string;
  uploaded_by: string;
  uploader_role: "patient" | "doctor" | "nutritionist" | "administrator" | "reception";
}

interface VideoCardProps {
  video: Video;
}

const VideoCard = memo(({ video }: VideoCardProps) => {
  const videoUrl = supabase.storage.from('videos').getPublicUrl(video.video_path).data.publicUrl;
  
  return (
    <Card key={video.id} className="overflow-hidden">
      <video
        className="w-full aspect-video object-cover"
        controls
        src={videoUrl}
        preload="none"
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
});

VideoCard.displayName = "VideoCard";

const LoadingSkeleton = () => (
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

export const VideoList = () => {
  const [showAll, setShowAll] = useState(false);
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
      return data as Video[];
    },
  });

  const toggleShowAll = useCallback(() => {
    setShowAll(prev => !prev);
  }, []);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const displayedVideos = showAll ? videos : videos?.slice(0, 4);
  const hasMoreVideos = videos && videos.length > 4;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedVideos?.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
      {hasMoreVideos && (
        <div className="flex justify-center">
          <Button 
            variant="outline"
            onClick={toggleShowAll}
            className="mt-4"
          >
            {showAll ? "Show Less" : "Show More"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default memo(VideoList);

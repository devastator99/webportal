
import { useState, memo, useCallback } from "react";
import { useQuery, QueryClientProvider, QueryClient } from "@tanstack/react-query";
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

// Memoized VideoCard with optimized rendering
const VideoCard = memo(({ video }: { video: Video }) => {
  try {
    const videoUrl = supabase.storage.from('videos').getPublicUrl(video.video_path).data.publicUrl;
    
    return (
      <Card key={video.id} className="overflow-hidden">
        <video
          className="w-full aspect-video object-cover"
          controls
          src={videoUrl}
          preload="none" // Don't preload video data
          loading="lazy" // Use native lazy loading
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
  } catch (error) {
    return (
      <Card className="overflow-hidden">
        <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
          <p className="text-gray-500">Video unavailable</p>
        </div>
        <CardHeader>
          <CardTitle>{video.title || 'Untitled'}</CardTitle>
          <CardDescription>
            Educational Video
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
});

VideoCard.displayName = "VideoCard";

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(2)].map((_, i) => (
      <Card key={i} className="animate-pulse">
        <div className="h-40 bg-gray-200 rounded-t-lg" />
        <CardHeader>
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
        </CardHeader>
      </Card>
    ))}
  </div>
);

// Simplified sample videos
const sampleVideos: Video[] = [
  {
    id: "sample1",
    title: "Understanding Diabetes Management",
    description: "Learn about the basics of diabetes management and daily care routines.",
    video_path: "sample/diabetes-intro.mp4",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    uploaded_by: "sample",
    uploader_role: "doctor"
  },
  {
    id: "sample2",
    title: "Thyroid Health Essentials",
    description: "An overview of thyroid function and common thyroid conditions.",
    video_path: "sample/thyroid-basics.mp4",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    uploaded_by: "sample",
    uploader_role: "doctor"
  }
];

// Optimized VideoList component
export const VideoList = () => {
  const [showAll, setShowAll] = useState(false);
  
  // Simplified query with faster options
  const { data: videos, isLoading } = useQuery({
    queryKey: ["knowledge_videos"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('knowledge_videos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10); // Limit initial fetch

        if (error || !data || data.length === 0) {
          return sampleVideos;
        }
        
        return data as Video[];
      } catch (err) {
        return sampleVideos;
      }
    },
    // Faster query options
    retry: 0,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const toggleShowAll = useCallback(() => {
    setShowAll(prev => !prev);
  }, []);

  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  const displayVideos = videos || sampleVideos;
  const displayedVideos = showAll ? displayVideos : displayVideos.slice(0, 3);
  const hasMoreVideos = displayVideos.length > 3;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
      {hasMoreVideos && (
        <div className="flex justify-center">
          <Button 
            variant="outline"
            onClick={toggleShowAll}
            className="mt-2"
          >
            {showAll ? "Show Less" : "Show More"}
          </Button>
        </div>
      )}
    </div>
  );
};

// Optimized standalone version with minimal QueryClient
export const StandaloneVideoList = () => {
  // Create a lightweight QueryClient with minimal configuration
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        staleTime: 300000,
        refetchOnWindowFocus: false,
      }
    }
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <VideoList />
    </QueryClientProvider>
  );
};

export default memo(StandaloneVideoList);

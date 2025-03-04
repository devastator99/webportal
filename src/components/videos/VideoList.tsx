
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

interface VideoCardProps {
  video: Video;
}

const VideoCard = memo(({ video }: VideoCardProps) => {
  // Add error handling for video URL retrieval
  try {
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
  } catch (error) {
    console.error('Error creating video card:', error);
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

// Sample videos for fallback when database is unavailable
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
  },
  {
    id: "sample3",
    title: "Nutritional Guidelines for Hormone Health",
    description: "Dietary recommendations to support endocrine system health.",
    video_path: "sample/nutrition-hormones.mp4",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    uploaded_by: "sample",
    uploader_role: "nutritionist"
  }
];

// Standalone VideoList component that doesn't require external QueryClientProvider
export const VideoList = () => {
  const [showAll, setShowAll] = useState(false);
  
  try {
    // Try to use the existing QueryClient from context
    const { data: videos, isLoading, error } = useQuery({
      queryKey: ["knowledge_videos"],
      queryFn: async () => {
        try {
          console.log('Fetching knowledge videos...');
          const { data, error } = await supabase
            .from('knowledge_videos')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching videos:', error);
            // Return sample videos instead of throwing error
            console.log('Falling back to sample videos');
            return sampleVideos;
          }
          
          if (!data || data.length === 0) {
            console.log('No videos found, using sample videos');
            return sampleVideos;
          }
          
          console.log('Videos fetched successfully:', data.length);
          return data as Video[];
        } catch (err) {
          console.error('Exception in video fetch:', err);
          // Return sample videos on any error
          console.log('Falling back to sample videos due to exception');
          return sampleVideos;
        }
      },
      // Minimize retry attempts and prevent showing loading state for too long
      retry: 1,
      staleTime: 60000,
      gcTime: 300000,
    });

    const toggleShowAll = useCallback(() => {
      setShowAll(prev => !prev);
    }, []);

    // Handle loading state
    if (isLoading) {
      return <LoadingSkeleton />;
    }
    
    // Always use sample videos if there's an error or no videos
    const displayVideos = videos || sampleVideos;
    const displayedVideos = showAll ? displayVideos : displayVideos.slice(0, 4);
    const hasMoreVideos = displayVideos.length > 4;

    return (
      <div className="space-y-8">
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
              className="mt-4"
            >
              {showAll ? "Show Less" : "Show More"}
            </Button>
          </div>
        )}
      </div>
    );
  } catch (error) {
    // If there's an error with the query context, use a fallback with sample videos
    console.error('React Query context error:', error);
    console.log('Falling back to sample videos without React Query');
    
    // Create a simple display with sample videos
    const displayedVideos = showAll ? sampleVideos : sampleVideos.slice(0, 4);
    const hasMoreVideos = sampleVideos.length > 4;
    
    const toggleShowAll = useCallback(() => {
      setShowAll(prev => !prev);
    }, []);

    return (
      <div className="space-y-8">
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
              className="mt-4"
            >
              {showAll ? "Show Less" : "Show More"}
            </Button>
          </div>
        )}
      </div>
    );
  }
};

// Self-contained version of VideoList that brings its own QueryClient
// This ensures it works even when used in a component tree without QueryClientProvider
export const StandaloneVideoList = () => {
  // Create a new QueryClient just for this component
  const queryClient = new QueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <VideoList />
    </QueryClientProvider>
  );
};

export default memo(StandaloneVideoList);

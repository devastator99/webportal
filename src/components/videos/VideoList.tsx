
import { useState, memo, useCallback, useEffect } from "react";
import { useQuery, QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface Video {
  id: string;
  title: string;
  description: string;
  video_path: string;
  created_at: string;
  updated_at: string;
  uploaded_by: string;
  uploader_role: "patient" | "doctor" | "nutritionist" | "administrator" | "reception";
  is_youtube?: boolean;
}

const getYoutubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const VideoCard = memo(({ video, onLoadStart, onLoadComplete }: { 
  video: Video; 
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLoadStart = () => {
    setIsLoading(true);
    onLoadStart?.();
  };
  
  const handleLoadComplete = () => {
    setIsLoading(false);
    onLoadComplete?.();
  };

  if (video.is_youtube || video.video_path.includes('youtube.com') || video.video_path.includes('youtu.be')) {
    const videoId = getYoutubeVideoId(video.video_path);
    
    return (
      <Card key={video.id} className="overflow-hidden">
        <div className="w-full aspect-video relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="w-3/4">
                <Progress value={50} className="h-2" />
                <p className="text-xs text-center mt-2">Loading YouTube video...</p>
              </div>
            </div>
          )}
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleLoadComplete}
            onLoadStart={handleLoadStart}
          ></iframe>
        </div>
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
  }
  
  try {
    const videoUrl = supabase.storage.from('videos').getPublicUrl(video.video_path).data.publicUrl;
    
    return (
      <Card key={video.id} className="overflow-hidden">
        <div className="w-full aspect-video relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="w-3/4">
                <Progress value={50} className="h-2" />
                <p className="text-xs text-center mt-2">Loading video...</p>
              </div>
            </div>
          )}
          <video
            className="w-full aspect-video object-cover"
            controls
            src={videoUrl}
            preload="metadata"
            onLoadStart={handleLoadStart}
            onCanPlay={handleLoadComplete}
          />
        </div>
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

const sampleVideos: Video[] = [
  {
    id: "sample1",
    title: "Understanding Diabetes Management",
    description: "Learn about the basics of diabetes management and daily care routines.",
    video_path: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    uploaded_by: "sample",
    uploader_role: "doctor",
    is_youtube: true
  },
  {
    id: "sample2",
    title: "Thyroid Health Essentials",
    description: "An overview of thyroid function and common thyroid conditions.",
    video_path: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    uploaded_by: "sample",
    uploader_role: "doctor",
    is_youtube: true
  }
];

export const VideoList = () => {
  const [shouldFetch, setShouldFetch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingVideos, setLoadingVideos] = useState(0);
  const itemsPerPage = 2; // Show only 2 videos per page initially for faster loading
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldFetch(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  const { data: allVideos, isLoading } = useQuery({
    queryKey: ["knowledge_videos"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('knowledge_videos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
          return sampleVideos;
        }
        
        return data as Video[];
      } catch (err) {
        return sampleVideos;
      }
    },
    retry: 0,
    staleTime: 300000,
    refetchOnWindowFocus: false,
    enabled: shouldFetch
  });

  const videos = allVideos || sampleVideos;
  const totalPages = Math.ceil(videos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayVideos = videos.slice(startIndex, startIndex + itemsPerPage);
  
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);
  
  const handleVideoLoadStart = useCallback(() => {
    setLoadingVideos(prev => prev + 1);
  }, []);
  
  const handleVideoLoadComplete = useCallback(() => {
    setLoadingVideos(prev => Math.max(0, prev - 1));
  }, []);

  if (!shouldFetch || isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {loadingVideos > 0 && (
        <div className="bg-white dark:bg-gray-900 py-2 px-4 rounded-md shadow mb-4 flex items-center gap-2">
          <Progress value={75} className="h-2 flex-1" />
          <span className="text-sm">Loading videos...</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayVideos.map((video) => (
          <VideoCard 
            key={video.id} 
            video={video} 
            onLoadStart={handleVideoLoadStart}
            onLoadComplete={handleVideoLoadComplete}
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={prevPage} 
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink 
                  isActive={currentPage === i + 1}
                  onClick={() => goToPage(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={nextPage} 
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export const StandaloneVideoList = () => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        staleTime: 300000,
        refetchOnWindowFocus: false,
      }
    }
  }));
  
  return (
    <QueryClientProvider client={queryClient}>
      <VideoList />
    </QueryClientProvider>
  );
};

export default memo(StandaloneVideoList);

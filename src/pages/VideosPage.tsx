
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { PatientAppLayout } from "@/layouts/PatientAppLayout";
import { DoctorAppLayout } from "@/layouts/DoctorAppLayout";
import { AdminAppLayout } from "@/layouts/AdminAppLayout";
import { AppLayout } from "@/layouts/AppLayout";

const VideosPage = () => {
  const { userRole } = useAuth();
  const [videos, setVideos] = useState([
    {
      id: 1,
      title: "Understanding Nutrition Basics",
      thumbnail: "https://images.unsplash.com/photo-1490818387583-1baba5e638af",
      duration: "15:20",
      category: "Nutrition"
    },
    {
      id: 2,
      title: "Daily Exercise Routines",
      thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
      duration: "12:45",
      category: "Exercise"
    },
    {
      id: 3,
      title: "Stress Management Techniques",
      thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
      duration: "10:15",
      category: "Mental Health"
    },
    {
      id: 4,
      title: "Healthy Cooking Methods",
      thumbnail: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f",
      duration: "18:30",
      category: "Nutrition"
    }
  ]);

  // Function to render the appropriate layout based on user role
  const getLayout = (children: React.ReactNode) => {
    switch (userRole) {
      case "patient":
        return <PatientAppLayout showHeader title="Educational Videos" description="Watch videos to learn about health and wellness" fullWidth={true}>{children}</PatientAppLayout>;
      case "doctor":
        return <DoctorAppLayout showHeader title="Educational Videos" description="Videos for your patients" fullWidth={true}>{children}</DoctorAppLayout>;
      case "administrator":
        return <AdminAppLayout showHeader title="Educational Videos" description="Manage video resources" fullWidth={true}>{children}</AdminAppLayout>;
      default:
        return <AppLayout>{children}</AppLayout>;
    }
  };

  return getLayout(
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {videos.map((video) => (
        <Card key={video.id} className="overflow-hidden">
          <div className="relative aspect-video">
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 text-xs rounded">
              {video.duration}
            </div>
          </div>
          <CardContent className="p-4">
            <div className="text-sm text-[#9b87f5] mb-1">{video.category}</div>
            <h3 className="font-semibold mb-2">{video.title}</h3>
            <button className="w-full bg-[#9b87f5] text-white py-2 rounded hover:bg-[#7E69AB]">
              Watch Now
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VideosPage;

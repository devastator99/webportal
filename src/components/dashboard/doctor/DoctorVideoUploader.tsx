
import { useState } from "react";
import { VideoUploader } from "@/components/videos/VideoUploader";
import { VideoList } from "@/components/videos/VideoList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const DoctorVideoUploader = () => {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Knowledge Sharing Videos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <VideoUploader />
        <div className="mt-4">
          <VideoList />
        </div>
      </CardContent>
    </Card>
  );
};

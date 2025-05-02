
import React from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import StandaloneVideoList, { VideoList } from '@/components/videos/VideoList';
import { VideoUploader } from '@/components/videos/VideoUploader';
import { useAuth, UserRoleEnum } from '@/contexts/AuthContext';
import { PatientPageLayout } from '@/components/layout/PatientPageLayout';
import { Card } from '@/components/ui/card';
import { Video } from 'lucide-react';

const VideosPage: React.FC = () => {
  const { user, userRole } = useAuth();
  const canUpload = userRole === UserRoleEnum.DOCTOR || userRole === UserRoleEnum.ADMINISTRATOR;

  if (!user) return null;

  return (
    <PatientPageLayout
      title="Educational Videos"
      description="Watch educational videos about health and wellness"
    >
      <ErrorBoundary>
        <div className="flex items-center gap-2 mb-6">
          <Video className="h-5 w-5 text-[#7E69AB]" />
          <h2 className="text-xl font-semibold">Health Knowledge Videos</h2>
        </div>

        {canUpload && (
          <div className="mb-8">
            <VideoUploader />
          </div>
        )}

        <div className="mt-6">
          <StandaloneVideoList />
        </div>
      </ErrorBoundary>
    </PatientPageLayout>
  );
};

export default VideosPage;

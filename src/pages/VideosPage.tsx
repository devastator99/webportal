
import React from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { PatientPageLayout } from '@/components/layout/PatientPageLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Video } from 'lucide-react';

const VideosPage: React.FC = () => {
  const { user, userRole } = useAuth();

  // Layout wrapper based on user role
  const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
    if (userRole === 'patient') {
      return (
        <PatientPageLayout
          title="Educational Videos"
          description="Watch educational videos about health and wellness"
        >
          {children}
        </PatientPageLayout>
      );
    }
    
    return (
      <div className="container mx-auto px-4 py-6 mt-14 md:mt-16">
        <h1 className="text-2xl font-bold mb-6">Educational Videos</h1>
        {children}
      </div>
    );
  };

  return (
    <ContentWrapper>
      <ErrorBoundary>
        <div className="flex items-center gap-2 mb-6">
          <Video className="h-5 w-5 text-[#7E69AB]" />
          <h2 className="text-xl font-semibold">Health Knowledge Videos</h2>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Videos Coming Soon</CardTitle>
            <CardDescription>
              Our educational video library is currently under construction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <Video className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground">
                We're working hard to bring you educational videos about health and wellness.
                Please check back soon for new content.
              </p>
            </div>
          </CardContent>
        </Card>
      </ErrorBoundary>
    </ContentWrapper>
  );
};

export default VideosPage;

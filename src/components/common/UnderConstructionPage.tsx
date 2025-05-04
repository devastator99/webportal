
import React from 'react';
import { Construction } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface UnderConstructionPageProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
}

const UnderConstructionPage = ({ 
  title = "Page Under Construction", 
  description = "We're working on improving this page. Please check back soon!", 
  showBackButton = true 
}: UnderConstructionPageProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full py-12">
      <Card className="w-full max-w-3xl shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl md:text-3xl font-bold">{title}</CardTitle>
          <CardDescription className="text-lg">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center pt-6 pb-8">
          <div className="flex items-center justify-center w-24 h-24 rounded-full bg-amber-100 mb-6">
            <Construction className="h-12 w-12 text-amber-600" />
          </div>
          
          <p className="text-center mb-8 max-w-md">
            Our team is actively developing this feature to provide you with a better experience.
            We appreciate your patience during this time.
          </p>
          
          {showBackButton && (
            <Button 
              onClick={() => navigate(-1)} 
              variant="outline"
              className="mt-2"
            >
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnderConstructionPage;

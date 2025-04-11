
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DummyPageProps {
  title: string;
  description?: string;
}

const DummyPage: React.FC<DummyPageProps> = ({ title, description }) => {
  return (
    <div className="container mx-auto pt-16 pb-8">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">This page is a placeholder for development.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DummyPage;

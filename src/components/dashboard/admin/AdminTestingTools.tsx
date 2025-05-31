
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestDataCleanup } from '@/components/testing/TestDataCleanup';
import { DeleteSpecificUser } from '@/components/testing/DeleteSpecificUser';
import { Wrench } from 'lucide-react';

export const AdminTestingTools = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Testing & Development Tools
        </CardTitle>
        <CardDescription>
          Tools for managing test data and development environment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="specific-delete" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="specific-delete">Delete Specific User</TabsTrigger>
            <TabsTrigger value="bulk-cleanup">Bulk Test Cleanup</TabsTrigger>
          </TabsList>
          
          <TabsContent value="specific-delete" className="mt-4">
            <DeleteSpecificUser />
          </TabsContent>
          
          <TabsContent value="bulk-cleanup" className="mt-4">
            <TestDataCleanup />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { migratePhoneNumbersFromMetadata } from '@/utils/registrationVerification';

export const PhoneDataMigration: React.FC = () => {
  const [migrationResults, setMigrationResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMigration = async () => {
    setIsLoading(true);
    setMigrationResults(null);
    
    try {
      const result = await migratePhoneNumbersFromMetadata();
      console.log("Migration result:", result);
      setMigrationResults(result);
    } catch (error) {
      console.error("Error during migration:", error);
      setMigrationResults({ success: false, error: 'Migration failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Phone Number Data Migration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            This utility migrates phone numbers from auth metadata to the profiles table 
            for users who registered but don't have phone numbers stored in their profile.
          </p>
          
          <Button 
            onClick={handleMigration} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Migrating...' : 'Run Phone Number Migration'}
          </Button>
        </div>

        {migrationResults && (
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <div><strong>Migration Status:</strong> {migrationResults.success ? 'Success' : 'Failed'}</div>
                
                {migrationResults.success ? (
                  <div className="space-y-1">
                    <div><strong>Migrated:</strong> {migrationResults.migrated_count} profiles</div>
                    <div><strong>Total Processed:</strong> {migrationResults.total_processed} users</div>
                    
                    {migrationResults.results && migrationResults.results.length > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded max-h-60 overflow-y-auto">
                        <div><strong>Migration Details:</strong></div>
                        <div className="text-sm space-y-1 mt-2">
                          {migrationResults.results.map((item: any, index: number) => (
                            <div key={index} className={`${item.success ? 'text-green-700' : 'text-red-700'}`}>
                              User {item.user_id}: {item.phone} - {item.success ? 'Success' : `Failed: ${item.error}`}
                              {item.skipped && ` (${item.skipped})`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div><strong>Error:</strong> {migrationResults.error}</div>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

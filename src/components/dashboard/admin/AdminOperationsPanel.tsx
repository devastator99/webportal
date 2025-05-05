
import React from 'react';
import { DefaultCareTeamSettings } from '@/components/dashboard/admin/DefaultCareTeamSettings';
import { RegistrationProgressReport } from '@/components/dashboard/admin/RegistrationProgressReport';
import { SyncCareTeamsButton } from '@/components/dashboard/admin/SyncCareTeamsButton';
import { PatientAssignmentManager } from '@/components/dashboard/admin/PatientAssignmentManager';

export const AdminOperationsPanel: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <RegistrationProgressReport />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DefaultCareTeamSettings />
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <SyncCareTeamsButton />
          </div>
          <PatientAssignmentManager />
        </div>
      </div>
    </div>
  );
};

export default AdminOperationsPanel;

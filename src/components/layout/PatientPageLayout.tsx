
import { ReactNode } from "react";
import { PatientAppLayout } from '@/layouts/PatientAppLayout';

interface PatientPageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showHeader?: boolean;
}

/**
 * @deprecated Use PatientAppLayout instead
 * This component exists only for backward compatibility
 * and redirects to PatientAppLayout with the same props
 */
export const PatientPageLayout = ({
  children,
  title,
  description,
  showHeader = true,
}: PatientPageLayoutProps) => {
  return (
    <PatientAppLayout
      title={title}
      description={description}
      showHeader={showHeader}
    >
      {children}
    </PatientAppLayout>
  );
};

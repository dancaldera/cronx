import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DashboardErrorBoundary } from '@/components/ui/dashboard-error-boundary';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DashboardErrorBoundary>
          {children}
        </DashboardErrorBoundary>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
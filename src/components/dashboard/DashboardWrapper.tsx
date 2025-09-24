"use client";

import { DashboardErrorBoundary } from '../common/DashboardErrorBoundary';
import { RoleBasedDashboard } from './RoleBasedDashboard';

interface DashboardWrapperProps {
  className?: string;
}

export function DashboardWrapper({ className }: DashboardWrapperProps) {
  return (
    <DashboardErrorBoundary>
      <RoleBasedDashboard className={className} />
    </DashboardErrorBoundary>
  );
}

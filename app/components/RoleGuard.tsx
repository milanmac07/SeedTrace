'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Feature, hasPermission, UserRole } from '../../utils/permissions';

interface RoleGuardProps {
  feature: Feature;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGuard({ feature, children, fallback = null }: RoleGuardProps) {
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('seedtrace_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed.role);
      } catch {
        setUserRole(null);
      }
    }
  }, []);

  if (!userRole || !hasPermission(userRole, feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
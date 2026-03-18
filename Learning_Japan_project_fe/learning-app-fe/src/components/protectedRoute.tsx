// src/components/ProtectedRoute.tsx
import React, { ReactNode } from "react";
import { useHasRole } from "@/hooks/useHasRole";

interface ProtectedRouteProps {
  roles: string[]; // roles được phép truy cập
  children: ReactNode;
  fallback?: ReactNode; // UI hiển thị khi không đủ quyền
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  roles,
  children,
  fallback = <p>Không có quyền truy cập</p>,
}) => {
  const hasAccess = useHasRole(roles);

  if (!hasAccess) return <>{fallback}</>;

  return <>{children}</>;
};

// src/hooks/useHasRole.ts
import { useAuthStore } from "@/stores/authStore";
import { getRolesFromToken } from "@/utils/jwt";

export const useHasRole = (requiredRoles: string[]): boolean => {
  const { accessToken } = useAuthStore.getState();

  if (!accessToken) return false;

  const userRoles = getRolesFromToken(accessToken);

  // Kiểm tra ít nhất 1 role hợp lệ
  return requiredRoles.some((role) => userRoles.includes(role));
};

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth";

/** 관리자 전용 경로 보호 — 비로그인·일반 사용자는 로그인 화면으로 보낸다 */
export default function AdminGuard({ children }: { children: ReactNode }) {
  const { isLoggedIn, isAuthLoading, principalType } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-neutral-500">
        확인 중...
      </div>
    );
  }
  if (!isLoggedIn || principalType !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

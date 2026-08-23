import { http, tokenStore } from "./http";

export interface AuthResult {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  name: string;
  role: string; // ROLE_USER | ROLE_ADMIN
}

export interface AdminAuthResult extends AuthResult {
  adminId: string;
  departmentId?: string;
  departmentName?: string;
}

export const authApi = {
  // 소셜 로그인 (Google) — 백엔드가 idToken 검증 후 JWT 발급
  async socialLogin(idToken: string): Promise<AuthResult> {
    const res = await http.post<AuthResult>("/auth/google", { idToken });
    tokenStore.set(res.accessToken, res.refreshToken);
    return res;
  },

  // refresh token으로 access token 재발급
  async refresh(): Promise<AuthResult> {
    const refreshToken = tokenStore.getRefresh();
    const res = await http.post<AuthResult>("/auth/refresh", { refreshToken });
    tokenStore.set(res.accessToken, res.refreshToken);
    return res;
  },

  // 관리자 로그인 (아이디/비밀번호)
  async adminLogin(loginId: string, password: string): Promise<AdminAuthResult> {
    const res = await http.post<AdminAuthResult>("/admin/auth/login", {
      loginId,
      password,
    });
    tokenStore.set(res.accessToken, res.refreshToken);
    return res;
  },

  logout() {
    tokenStore.clear();
  },
};

import { createContext, useContext } from "react";
import type { User } from "./types";
import type { PrincipalType } from "./api/http";

export interface AuthContextType {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  user: User | null;
  principalType: PrincipalType | null;
  login: (idToken: string) => Promise<PrincipalType>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isAuthLoading: true,
  user: null,
  principalType: null,
  login: async () => "USER",
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

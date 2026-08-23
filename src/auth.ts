import { createContext, useContext } from "react";
import type { User } from "./types";

export interface AuthContextType {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  user: User | null;
  login: (idToken: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isAuthLoading: true,
  user: null,
  login: async () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

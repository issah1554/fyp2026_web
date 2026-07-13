"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getStoredUser,
  loginWithPassword,
  logoutFromApi,
  type LoginCredentials,
  type AuthUser,
} from "@/src/services/auth/authService";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getStoredUser());
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const nextUser = await loginWithPassword(credentials);
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    await logoutFromApi();
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}

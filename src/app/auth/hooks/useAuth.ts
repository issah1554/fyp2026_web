"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearStoredUser,
  demoUser,
  getStoredUser,
  setStoredUser,
  type AuthUser,
} from "../services/authService";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: (user?: AuthUser) => Promise<void>;
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

  const login = useCallback(async (nextUser: AuthUser = demoUser) => {
    setStoredUser(nextUser);
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    clearStoredUser();
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}

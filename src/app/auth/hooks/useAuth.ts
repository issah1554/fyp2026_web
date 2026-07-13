"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AUTH_SESSION_CHANGED_EVENT,
  getStoredUser,
  initializeAuthSession,
  loginWithPassword,
  logoutFromApi,
  refreshSessionIfNeeded,
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
    let active = true;

    const syncUser = () => {
      setUser(getStoredUser());
    };

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncUser);
    const refreshInterval = window.setInterval(() => {
      void refreshSessionIfNeeded().then((nextUser) => {
        if (active) {
          setUser(nextUser);
        }
      });
    }, 60_000);

    void initializeAuthSession()
      .then((nextUser) => {
        if (active) {
          setUser(nextUser);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncUser);
    };
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

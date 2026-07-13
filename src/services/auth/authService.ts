export type AuthRole = {
  id?: number;
  name?: string;
  code?: string;
};

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string | AuthRole;
  permissions: string[];
};

const AUTH_USER_KEY = "marketia.auth.user";
const AUTH_ACCESS_TOKEN_KEY = "marketia.auth.access-token";
const AUTH_REFRESH_TOKEN_KEY = "marketia.auth.refresh-token";
export const AUTH_SESSION_CHANGED_EVENT = "marketia.auth.session-changed";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

type BackendProfile = {
  role?: string;
};

type BackendUser = {
  user_id?: string;
  id?: string | number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile?: BackendProfile;
};

type BackendAuthData = {
  access: string;
  refresh: string;
  user: BackendUser;
};

type BackendRefreshData = {
  access: string;
  refresh?: string;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: string;
  phone_number?: string;
  organization?: string;
};

export type RegisterResult = {
  message: string;
  user: AuthUser;
};

export type MessageResult = {
  message: string;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function emitAuthSessionChanged() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

function getJwtExpiryMs(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(window.atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpiring(token: string, leewayMs = 60_000) {
  if (!isBrowser()) {
    return false;
  }

  const expiresAt = getJwtExpiryMs(token);
  return expiresAt !== null && expiresAt <= Date.now() + leewayMs;
}

function getErrorMessage(payload: ApiResponse<unknown> | null, fallback: string) {
  if (payload?.message) {
    return payload.message;
  }

  if (payload?.errors && typeof payload.errors === "object") {
    const firstError = Object.values(payload.errors)[0];
    if (Array.isArray(firstError) && firstError[0]) {
      return String(firstError[0]);
    }
    if (firstError) {
      return String(firstError);
    }
  }

  return fallback;
}

function normalizeUser(user: BackendUser): AuthUser {
  const role = user.profile?.role ?? "user";

  return {
    id: String(user.user_id ?? user.id ?? user.username ?? user.email ?? ""),
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    email: user.email ?? "",
    role,
    permissions: role.toLowerCase() === "admin" ? ["*"] : [],
  };
}

export function getStoredAccessToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (!isBrowser()) {
    return null;
  }

  const stored = window.localStorage.getItem(AUTH_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      window.localStorage.removeItem(AUTH_USER_KEY);
    }
  }

  return null;
}

export function setStoredUser(user: AuthUser, tokens?: { access: string; refresh: string }) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  if (tokens) {
    window.localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, tokens.access);
    window.localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, tokens.refresh);
  }
  emitAuthSessionChanged();
}

export function clearStoredUser() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_USER_KEY);
  window.localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  emitAuthSessionChanged();
}

function setStoredAccessToken(access: string, refresh?: string) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, access);
  if (refresh) {
    window.localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refresh);
  }
  emitAuthSessionChanged();
}

export async function loginWithPassword(credentials: LoginCredentials): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<BackendAuthData> | null;

  if (!response.ok || !payload?.data?.access || !payload.data.refresh || !payload.data.user) {
    throw new Error(getErrorMessage(payload, "Login failed. Check your credentials and try again."));
  }

  const user = normalizeUser(payload.data.user);
  setStoredUser(user, {
    access: payload.data.access,
    refresh: payload.data.refresh,
  });
  return user;
}

export async function registerUser(payload: RegisterPayload): Promise<RegisterResult> {
  const response = await fetch(`${API_BASE_URL}/auth/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const result = (await response.json().catch(() => null)) as ApiResponse<BackendUser> | null;

  if (!response.ok || !result?.data) {
    throw new Error(getErrorMessage(result, "Registration failed. Check your details and try again."));
  }

  return {
    message: result.message ?? "Registration successful.",
    user: normalizeUser(result.data),
  };
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getStoredRefreshToken();
  if (!refresh) {
    clearStoredUser();
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<BackendRefreshData> | null;

  if (!response.ok || !payload?.data?.access) {
    clearStoredUser();
    return null;
  }

  setStoredAccessToken(payload.data.access, payload.data.refresh);
  return payload.data.access;
}

export async function initializeAuthSession(): Promise<AuthUser | null> {
  const user = getStoredUser();
  if (!user) {
    clearStoredUser();
    return null;
  }

  const access = getStoredAccessToken();
  if (access && !isTokenExpiring(access)) {
    return user;
  }

  const refreshedAccess = await refreshAccessToken();
  return refreshedAccess ? user : null;
}

export async function refreshSessionIfNeeded(): Promise<AuthUser | null> {
  const user = getStoredUser();
  const access = getStoredAccessToken();
  if (!user) {
    clearStoredUser();
    return null;
  }

  if (!access || isTokenExpiring(access, 120_000)) {
    const refreshedAccess = await refreshAccessToken();
    return refreshedAccess ? user : null;
  }

  return user;
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const requestWithToken = (token: string | null) => {
    const headers = new Headers(init.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(input, {
      ...init,
      headers,
    });
  };

  let response = await requestWithToken(getStoredAccessToken());
  if (response.status !== 401) {
    return response;
  }

  const refreshedAccess = await refreshAccessToken();
  if (!refreshedAccess) {
    return response;
  }

  response = await requestWithToken(refreshedAccess);
  if (response.status === 401) {
    clearStoredUser();
  }
  return response;
}

export async function requestPasswordReset(email: string): Promise<MessageResult> {
  const response = await fetch(`${API_BASE_URL}/auth/password/reset/request/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  const result = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(result, "Password reset request failed. Try again."));
  }

  return {
    message: result?.message ?? "If the account exists, a password reset link has been sent.",
  };
}

export async function confirmPasswordReset(token: string, password: string): Promise<MessageResult> {
  const response = await fetch(`${API_BASE_URL}/auth/password/reset/confirm/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password }),
  });
  const result = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(result, "Password reset failed. Try again."));
  }

  return {
    message: result?.message ?? "Password reset successful.",
  };
}

export async function logoutFromApi() {
  const token = getStoredAccessToken();
  if (!token) {
    clearStoredUser();
    return;
  }

  try {
    await fetch(`${API_BASE_URL}/auth/logout/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } finally {
    clearStoredUser();
  }
}

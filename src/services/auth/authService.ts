import { API_BASE_URL } from "@/src/services/config";

export type AuthRole = {
  id?: string | number;
  role_id?: string;
  name?: string;
  code?: string;
  permissions?: BackendPermission[];
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

type BackendProfile = {
  role?: string | AuthRole;
  permissions?: BackendPermission[];
};

type BackendUser = {
  user_id?: string;
  id?: string | number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string | AuthRole;
  permissions?: BackendPermission[] | string[];
  profile?: BackendProfile;
};

type BackendPermission = {
  permission_id?: string;
  code?: string;
  name?: string;
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

  const firstError = getFirstErrorMessage(payload?.errors);
  if (firstError) return firstError;

  return fallback;
}

function getFirstErrorMessage(errors: unknown): string {
  if (Array.isArray(errors)) {
    for (const error of errors) {
      const message = getFirstErrorMessage(error);
      if (message) return message;
    }
    return "";
  }

  if (errors && typeof errors === "object") {
    for (const error of Object.values(errors)) {
      const message = getFirstErrorMessage(error);
      if (message) return message;
    }
    return "";
  }

  return errors ? String(errors) : "";
}

function getRoleCode(role: string | AuthRole | undefined) {
  if (!role) {
    return "user";
  }

  return typeof role === "string" ? role : role.code ?? role.name ?? "user";
}

function normalizePermissions(permissions: BackendPermission[] | string[] | undefined) {
  if (!permissions) {
    return [];
  }

  return permissions
    .map((permission) => (typeof permission === "string" ? permission : permission.code))
    .filter((permission): permission is string => Boolean(permission));
}

function normalizeRole(role: string | AuthRole | undefined): string | AuthRole {
  if (!role) {
    return "user";
  }

  if (typeof role === "string") {
    return role;
  }

  return {
    ...role,
    id: role.role_id ?? role.id,
  };
}

function normalizeUser(user: BackendUser): AuthUser {
  const backendRole = user.profile?.role ?? user.role;
  const role = normalizeRole(backendRole);
  const roleCode = getRoleCode(role);
  const rolePermissions = typeof backendRole === "object" ? normalizePermissions(backendRole.permissions) : [];
  const permissions = [
    ...normalizePermissions(user.permissions),
    ...normalizePermissions(user.profile?.permissions),
    ...rolePermissions,
  ];
  const uniquePermissions = Array.from(new Set(permissions));

  return {
    id: String(user.user_id ?? user.id ?? user.username ?? user.email ?? ""),
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    email: user.email ?? "",
    role,
    permissions: roleCode.toLowerCase() === "admin" ? ["*"] : uniquePermissions,
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

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await authenticatedFetch(`${API_BASE_URL}/auth/me/`);
  const payload = (await response.json().catch(() => null)) as ApiResponse<BackendUser> | null;

  if (response.status === 401) {
    clearStoredUser();
    return null;
  }

  if (!response.ok || !payload?.data) {
    return getStoredUser();
  }

  const user = normalizeUser(payload.data);
  setStoredUser(user);
  return user;
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
  return (await fetchCurrentUser()) ?? user;
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
    return (await fetchCurrentUser()) ?? user;
  }

  const refreshedAccess = await refreshAccessToken();
  return refreshedAccess ? (await fetchCurrentUser()) ?? user : null;
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
    return refreshedAccess ? (await fetchCurrentUser()) ?? user : null;
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

export async function verifyEmail(token: string): Promise<MessageResult> {
  const response = await fetch(`${API_BASE_URL}/auth/email/verify/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });
  const result = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(result, "Email verification failed. The link may be invalid or expired."));
  }

  return {
    message: result?.message ?? "Email verified successfully.",
  };
}

export async function resendEmailVerification(email: string): Promise<MessageResult> {
  const response = await fetch(`${API_BASE_URL}/auth/email/resend/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  const result = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(result, "Could not resend the verification link. Try again."));
  }

  return {
    message: result?.message ?? "A new verification link has been sent to your email.",
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

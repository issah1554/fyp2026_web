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

function isBrowser() {
  return typeof window !== "undefined";
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
}

export function clearStoredUser() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_USER_KEY);
  window.localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
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

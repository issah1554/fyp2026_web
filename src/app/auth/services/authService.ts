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
const AUTH_LOGGED_OUT_KEY = "marketia.auth.logged-out";

export const demoUser: AuthUser = {
  id: "demo-admin",
  firstName: "Marketia",
  lastName: "Admin",
  email: "admin@marketia.test",
  role: { id: 1, name: "Admin", code: "admin" },
  permissions: ["*"],
};

function isBrowser() {
  return typeof window !== "undefined";
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

  return window.localStorage.getItem(AUTH_LOGGED_OUT_KEY) ? null : demoUser;
}

export function setStoredUser(user: AuthUser) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.localStorage.removeItem(AUTH_LOGGED_OUT_KEY);
}

export function clearStoredUser() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_USER_KEY);
  window.localStorage.setItem(AUTH_LOGGED_OUT_KEY, "true");
}

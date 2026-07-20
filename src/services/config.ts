const backendApiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;

if (!backendApiBaseUrl) {
  throw new Error("NEXT_PUBLIC_BACKEND_API_BASE_URL is required.");
}

export const API_BASE_URL = backendApiBaseUrl.replace(/\/+$/, "");

export function apiUrl(path: string) {
  const [pathname, query = ""] = path.split("?", 2);
  const normalizedPath = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  const url = normalizedPath ? `${API_BASE_URL}/${normalizedPath}` : API_BASE_URL;

  return query ? `${url}?${query}` : url;
}

const backendApiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;

if (!backendApiBaseUrl) {
  throw new Error("NEXT_PUBLIC_BACKEND_API_BASE_URL is required.");
}

export const API_BASE_URL = backendApiBaseUrl;

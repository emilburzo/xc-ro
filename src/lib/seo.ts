const DEFAULT_BASE_URL = "https://xc-ro.emilburzo.com";

export function getBaseUrl(): string {
  const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL
    ?.trim()
    .replace(/\/+$/, "");

  if (envBaseUrl) {
    return envBaseUrl;
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return DEFAULT_BASE_URL;
}

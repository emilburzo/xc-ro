const DEFAULT_BASE_URL = "https://xc-ro.emilburzo.com";

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE_URL;
}

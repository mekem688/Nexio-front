const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export const API_BASE = rawBase.replace(/\/$/, "");

export const WS_BASE = API_BASE
  ? API_BASE.replace(/^https/, "wss").replace(/^http/, "ws")
  : "";

export function apiUrl(path: string): string {
  return API_BASE + path;
}

export function wsUrl(): string {
  if (WS_BASE) return WS_BASE + "/ws";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

export function loginUrl(): string {
  return API_BASE + "/api/login";
}

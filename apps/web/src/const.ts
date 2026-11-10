export const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const NEXT_JS_PROXY_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_PROXY_URL ||
  "http://localhost:8080";

export const CHAT_DOMAIN =
  process.env.NEXT_PUBLIC_CHAT_DOMAIN ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:8080";

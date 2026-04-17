import { logEvent } from "@/lib/logger";

let hasValidatedRuntimeConfig = false;

export function validateRuntimeSecurityConfig() {
  if (hasValidatedRuntimeConfig) {
    return;
  }

  hasValidatedRuntimeConfig = true;

  if (!process.env.MONGODB_URI?.trim()) {
    logEvent("warn", "MONGODB_URI is not configured. Persistence is disabled.");
  }

  if (!process.env.APP_ORIGIN?.trim()) {
    logEvent("warn", "APP_ORIGIN is not configured. Falling back to request origin checks.");
  }

  if (process.env.NODE_ENV === "production" && !process.env.APP_ORIGIN?.trim()) {
    logEvent("warn", "APP_ORIGIN should be configured in production for stronger CSRF validation.");
  }
}

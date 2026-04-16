// Quick health check to validate MongoDB is reachable before full startup
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import { logEvent } from "@/lib/logger";

let dbHealthChecked = false;

export async function checkDatabaseHealth() {
  // Only check once per process
  if (dbHealthChecked) {
    return;
  }

  if (!isDatabaseConfigured()) {
    logEvent("warn", "Database not configured - running in demo mode");
    dbHealthChecked = true;
    return;
  }

  try {
    // Non-blocking health check - don't wait for full connection
    connectToDatabase().catch((error) => {
      logEvent("warn", "Database connection failed - some features unavailable", {
        error: error instanceof Error ? error.message : String(error)
      });
    });

    dbHealthChecked = true;
  } catch (error) {
    logEvent("error", "Unexpected error during DB health check", {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Logging utility for structured event logging throughout the application
// Logs are formatted with timestamp, level, message, and additional context

type LogLevel = "info" | "warn" | "error";

/**
 * Logs an event with the specified level and context
 * Routes to appropriate console method based on severity level
 * @param level - The severity level of the log (info, warn, error)
 * @param message - The main message to log
 * @param context - Additional structured data to include in the log entry
 */
export function logEvent(
  level: LogLevel,
  message: string,
  context: Record<string, unknown> = {}
) {
  // Build the log payload with timestamp and context
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context
  };

  // Route to appropriate console method based on level
  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.info(payload);
}

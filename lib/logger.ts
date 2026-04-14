type LogLevel = "info" | "warn" | "error";

export function logEvent(
  level: LogLevel,
  message: string,
  context: Record<string, unknown> = {}
) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context
  };

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

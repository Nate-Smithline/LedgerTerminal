/**
 * Return a client-safe error message. In production, avoid exposing
 * database or internal details; in development, allow more detail for debugging.
 */
export function safeErrorMessage(
  internalMessage: string | undefined,
  fallback = "An error occurred"
): string {
  if (process.env.NODE_ENV === "production") {
    return fallback;
  }
  return internalMessage?.slice(0, 200) ?? fallback;
}

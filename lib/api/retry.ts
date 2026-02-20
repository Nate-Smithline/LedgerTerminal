const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_MS = 1000;
const DEFAULT_MAX_MS = 30_000;

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 503);
}

function isRetryableError(e: unknown): boolean {
  if (e && typeof e === "object" && "status" in e && typeof (e as { status: number }).status === "number") {
    return isRetryableStatus((e as { status: number }).status);
  }
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("429") || msg.includes("rate") || msg.includes("overloaded")) return true;
  if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed") || msg.includes("network")) return true;
  if (msg.includes("timeout") || msg.includes("ETIMEDOUT")) return true;
  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialMs?: number;
    maxMs?: number;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  let initialMs = options?.initialMs ?? DEFAULT_INITIAL_MS;
  const maxMs = options?.maxMs ?? DEFAULT_MAX_MS;
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt === maxRetries || !isRetryableError(e)) throw e;
      const delay = Math.min(initialMs * Math.pow(2, attempt), maxMs);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

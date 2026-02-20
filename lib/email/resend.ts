import { Resend } from "resend";

/** Timeout for Resend API calls (30 seconds). Callers should use Promise.race with this value. */
export const RESEND_TIMEOUT_MS = 30_000;

let _resend: Resend | null = null;

export function getResendClient(): Resend {
  if (_resend) return _resend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }

  _resend = new Resend(apiKey);
  return _resend;
}

export function getFromAddress(): string {
  return process.env.EMAIL_FROM_ADDRESS || "ExpenseTerminal <noreply@expenseteterminal.com>";
}

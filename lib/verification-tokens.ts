import { createHash } from "crypto";
import { generateBibleToken } from "./bible-words";

/**
 * Hash a token for storage (we never store the raw token).
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a new verification token and its hash.
 * Returns { token, tokenHash, expiresAt }.
 */
export function createVerificationToken() {
  const token = generateBibleToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour — short expiry to limit token exposure
  return { token, tokenHash, expiresAt };
}

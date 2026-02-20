import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUserId } from "@/lib/get-current-user";

export type AuthResult =
  | { authorized: true; userId: string }
  | { authorized: false; status: number; body: { error: string } };

/**
 * Standardized auth check for API routes.
 * Returns authorized + userId, or 401 Unauthorized when not logged in.
 */
export async function requireAuth(
  supabase: SupabaseClient
): Promise<AuthResult> {
  const userId = await getCurrentUserId(supabase);
  if (!userId) {
    return { authorized: false, status: 401, body: { error: "Unauthorized" } };
  }
  return { authorized: true, userId };
}

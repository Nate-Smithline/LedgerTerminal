import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns the current user's id from the session, or null if not logged in.
 */
export async function getCurrentUserId(
  supabase: SupabaseClient
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export function isAuthRequired(): boolean {
  return process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true";
}

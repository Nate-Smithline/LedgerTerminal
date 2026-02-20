import {
  createSupabaseRouteClient,
} from "@/lib/supabase/server";
import { requireAuth } from "@/lib/middleware/auth";
import { rateLimitForRequest, generalApiLimit } from "@/lib/middleware/rate-limit";
import { safeErrorMessage } from "@/lib/api/safe-error";

export async function GET(req: Request) {
  const authClient = await createSupabaseRouteClient();
  const auth = await requireAuth(authClient);
  if (!auth.authorized) {
    return Response.json(auth.body, { status: auth.status });
  }
  const userId = auth.userId;
  const { success: rlOk } = await rateLimitForRequest(req, userId, generalApiLimit);
  if (!rlOk) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const supabase = authClient;

  const selectCols = "id,email,display_name,first_name,last_name,avatar_url,phone,email_opt_in,notification_email_updates,notification_group,onboarding_progress,terms_accepted_at,created_at,updated_at";
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select(selectCols)
    .eq("id", userId)
    .single();

  if (error) {
    return Response.json({ error: safeErrorMessage(error.message, "Failed to load profile") }, { status: 500 });
  }

  return Response.json(
    { data },
    {
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    }
  );
}

export async function PUT(req: Request) {
  const authClient = await createSupabaseRouteClient();
  const auth = await requireAuth(authClient);
  if (!auth.authorized) {
    return Response.json(auth.body, { status: auth.status });
  }
  const userId = auth.userId;
  const { success: rlOk } = await rateLimitForRequest(req, userId, generalApiLimit);
  if (!rlOk) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const supabase = authClient;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const allowed = [
    "first_name",
    "last_name",
    "phone",
    "notification_email_updates",
    "notification_group",
    "onboarding_progress",
  ];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const selectCols = "id,email,display_name,first_name,last_name,avatar_url,phone,email_opt_in,notification_email_updates,notification_group,onboarding_progress,terms_accepted_at,created_at,updated_at";
  const { data, error } = await (supabase as any)
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select(selectCols)
    .single();

  if (error) {
    return Response.json({ error: safeErrorMessage(error.message, "Failed to update profile") }, { status: 500 });
  }

  return Response.json({ data });
}

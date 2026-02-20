import {
  createSupabaseRouteClient,
} from "@/lib/supabase/server";
import { requireAuth } from "@/lib/middleware/auth";
import { rateLimitForRequest, generalApiLimit } from "@/lib/middleware/rate-limit";
import { safeErrorMessage } from "@/lib/api/safe-error";
import { parseQueryLimit, parseQueryOffset } from "@/lib/validation/schemas";

export async function GET(req: Request) {
  const authClient = await createSupabaseRouteClient();
  const auth = await requireAuth(authClient);
  if (!auth.authorized) {
    return new Response(JSON.stringify(auth.body), {
      status: auth.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  const userId = auth.userId;
  const { success: rlOk } = await rateLimitForRequest(req, userId, generalApiLimit);
  if (!rlOk) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }
  const supabase = authClient;

  const url = new URL(req.url);
  const limit = parseQueryLimit(url.searchParams.get("limit"));
  const offset = parseQueryOffset(url.searchParams.get("offset"));

  const cols = "id,user_id,name,account_type,institution,last_upload_at,transaction_count,created_at";
  const { data, error, count } = await (supabase as any)
    .from("data_sources")
    .select(cols, { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: safeErrorMessage(error.message, "Failed to load data sources") }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ data: data ?? [], count: count ?? (data?.length ?? 0) }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, max-age=300",
    },
  });
}

export async function POST(req: Request) {
  const authClient = await createSupabaseRouteClient();
  const auth = await requireAuth(authClient);
  if (!auth.authorized) {
    return new Response(JSON.stringify(auth.body), {
      status: auth.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  const userId = auth.userId;
  const { success: rlOkPost } = await rateLimitForRequest(req, userId, generalApiLimit);
  if (!rlOkPost) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }
  const supabase = authClient;

  let body: { name?: string; account_type?: string; institution?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.name || !body.account_type) {
    return new Response(
      JSON.stringify({ error: "name and account_type are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const cols = "id,user_id,name,account_type,institution,last_upload_at,transaction_count,created_at";
  const { data, error } = await (supabase as any)
    .from("data_sources")
    .insert({
      user_id: userId,
      name: body.name,
      account_type: body.account_type,
      institution: body.institution || null,
    })
    .select(cols)
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: safeErrorMessage(error.message, "Failed to create data source") }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ data }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

import {
  createSupabaseRouteClient,
} from "@/lib/supabase/server";
import { requireAuth } from "@/lib/middleware/auth";
import { rateLimitForRequest, generalApiLimit } from "@/lib/middleware/rate-limit";
import { safeErrorMessage } from "@/lib/api/safe-error";

export async function POST(req: Request) {
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

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;

  if (!file || !(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE_BYTES) {
    return Response.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
  }

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
  const EXT_TO_MIME: Record<string, (typeof ALLOWED_TYPES)[number]> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  const rawExt = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  const ext = (rawExt in EXT_TO_MIME ? rawExt : "png") as keyof typeof EXT_TO_MIME;
  const contentType = file.type?.toLowerCase().split(";")[0].trim();
  if (!contentType || !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(contentType)) {
    return Response.json(
      { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP." },
      { status: 400 }
    );
  }
  const expectedMime = EXT_TO_MIME[ext];
  if (expectedMime && contentType !== expectedMime) {
    return Response.json(
      { error: "File extension does not match file type." },
      { status: 400 }
    );
  }

  const filePath = `avatars/${userId}.${ext}`;

  const { error: uploadError } = await (supabase as any).storage
    .from("avatars")
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return Response.json({ error: safeErrorMessage(uploadError.message, "Failed to upload avatar") }, { status: 500 });
  }

  const { data: urlData } = (supabase as any).storage
    .from("avatars")
    .getPublicUrl(filePath);

  const avatarUrl = urlData?.publicUrl
    ? `${urlData.publicUrl}?t=${Date.now()}`
    : null;

  await (supabase as any)
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", userId);

  return Response.json({ data: { avatar_url: avatarUrl } });
}

export async function DELETE(req: Request) {
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

  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single();

  if (profile?.avatar_url) {
    const url = new URL(profile.avatar_url.split("?")[0]);
    const pathParts = url.pathname.split("/storage/v1/object/public/avatars/");
    if (pathParts[1]) {
      await (supabase as any).storage.from("avatars").remove([pathParts[1]]);
    }
  }

  await (supabase as any)
    .from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", userId);

  return Response.json({ ok: true });
}

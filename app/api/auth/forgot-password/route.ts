import { NextResponse } from "next/server";
import { rateLimitByIdentifier, passwordResetLimit } from "@/lib/middleware/rate-limit";
import { isValidEmail } from "@/lib/validation/email";

/**
 * POST /api/auth/forgot-password
 * Rate limit check before client calls resetPasswordForEmail.
 * Body: { email: string }
 */
export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  const { success } = await rateLimitByIdentifier(email, passwordResetLimit);
  if (!success) {
    return NextResponse.json(
      { error: "Too many reset attempts. Try again in an hour." },
      { status: 429 }
    );
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/middleware/auth";
import { safeErrorMessage } from "@/lib/api/safe-error";

/**
 * GET /api/test-anthropic
 * Quick connectivity check — does the key exist and what format?
 * Requires authentication.
 *
 * POST /api/test-anthropic
 * Full round-trip test: sends a real message to Claude and returns
 * the response, token usage, latency, and any errors.
 * Requires authentication. Optional body: { prompt?: string }
 */

export async function GET() {
  const authClient = await createSupabaseRouteClient();
  const auth = await requireAuth(authClient);
  if (!auth.authorized) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  const key = process.env.ANTHROPIC_API_KEY;

  const checks: { label: string; pass: boolean; detail: string }[] = [];

  checks.push({
    label: "ANTHROPIC_API_KEY is set",
    pass: !!key,
    detail: key ? "Set" : "MISSING — add it to .env.local",
  });

  if (key) {
    const validPrefix = key.startsWith("sk-ant-");
    checks.push({
      label: "Key format",
      pass: validPrefix,
      detail: validPrefix ? "Correct" : "Expected sk-ant-... prefix",
    });
    checks.push({
      label: "Key length",
      pass: key.length > 40,
      detail: key.length > 40 ? "OK" : "Seems too short",
    });
  }

  const allPass = checks.every((c) => c.pass);

  return NextResponse.json({
    status: allPass ? "ready" : "issues_found",
    checks,
    hint: allPass
      ? "Key looks good. Use POST /api/test-anthropic to do a live API call."
      : "Fix the issues above before testing a live call.",
  });
}

export async function POST(req: Request) {
  const authClient = await createSupabaseRouteClient();
  const auth = await requireAuth(authClient);
  if (!auth.authorized) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) {
    return NextResponse.json(
      {
        success: false,
        error: "ANTHROPIC_API_KEY is not set in .env.local",
        steps: [
          "1. Go to https://console.anthropic.com/settings/keys",
          "2. Create an API key",
          "3. Add ANTHROPIC_API_KEY=\"sk-ant-...\" to .env.local",
          "4. Restart your dev server",
        ],
      },
      { status: 500 }
    );
  }

  let body: { prompt?: string } = {};
  try {
    body = await req.json();
  } catch {
    // no body is fine
  }

  const testPrompt =
    body.prompt ||
    'Categorize this expense for IRS Schedule C: "Starbucks $4.50 on 2025-01-15". Reply with JSON: { "category": "...", "line": "...", "reasoning": "..." }';

  const startTime = Date.now();

  const ANTHROPIC_TIMEOUT_MS = 60_000; // 60 seconds
  try {
    const anthropic = new Anthropic({ apiKey: key, timeout: ANTHROPIC_TIMEOUT_MS });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      messages: [{ role: "user", content: testPrompt }],
    });

    const latencyMs = Date.now() - startTime;
    const textContent = message.content.find((c) => c.type === "text");

    return NextResponse.json({
      success: true,
      latencyMs,
      model: message.model,
      stopReason: message.stop_reason,
      usage: {
        inputTokens: message.usage?.input_tokens ?? 0,
        outputTokens: message.usage?.output_tokens ?? 0,
      },
      response: textContent?.text ?? "(no text in response)",
      rawContent: message.content,
    });
  } catch (e: unknown) {
    const latencyMs = Date.now() - startTime;
    const msg = e instanceof Error ? e.message : String(e);
    const name = e instanceof Error ? e.constructor.name : "Unknown";

    let diagnosis = "Unknown error";
    let steps: string[] = [];

    if (msg.includes("invalid x-api-key") || msg.includes("Invalid API") || msg.includes("401")) {
      diagnosis = "Your API key is invalid or revoked.";
      steps = [
        "1. Go to https://console.anthropic.com/settings/keys",
        "2. Check if the key is active (not revoked)",
        "3. If not, create a new key and update .env.local",
        "4. Restart your dev server (the key is read at startup)",
      ];
    } else if (msg.includes("credit") || msg.includes("billing") || msg.includes("payment")) {
      diagnosis = "Billing or credit issue on your Anthropic account.";
      steps = [
        "1. Go to https://console.anthropic.com/settings/billing",
        "2. Add a payment method or buy credits",
        "3. Try again",
      ];
    } else if (msg.includes("rate") || msg.includes("429") || msg.includes("overloaded")) {
      diagnosis = "Rate limited or API overloaded.";
      steps = ["Wait a minute and try again."];
    } else if (msg.includes("model") || msg.includes("not found")) {
      diagnosis = "The model is not available on your account.";
      steps = [
        "Check your API tier at https://console.anthropic.com",
        "claude-sonnet-4-20250514 requires a paid account.",
      ];
    } else if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed") || msg.includes("network")) {
      diagnosis = "Network error — cannot reach Anthropic servers.";
      steps = [
        "Check your internet connection",
        "If behind a proxy/VPN, ensure api.anthropic.com is accessible",
      ];
    } else {
      diagnosis = msg;
      steps = ["Check the full error below and your Anthropic dashboard."];
    }

    return NextResponse.json(
      {
        success: false,
        latencyMs,
        error: safeErrorMessage(msg, "API request failed"),
        errorType: process.env.NODE_ENV === "production" ? "Error" : name,
        diagnosis,
        steps,
      },
      { status: 500 }
    );
  }
}

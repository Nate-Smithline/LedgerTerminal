"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/AuthLayout";

function VerifyPendingContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    try {
      await fetch("/api/email/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResent(true);
    } catch {
      // Best effort
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <p className="text-center text-sm text-mono-medium mb-4">
        Welcome to ExpenseTerminal. Please check your email and confirm your
        account to get started.
      </p>

      {email && (
        <p className="text-center text-xs text-mono-light mb-8">
          We sent a verification link to <strong className="text-mono-medium">{email}</strong>
        </p>
      )}

      <button
        onClick={handleResend}
        disabled={resending || resent}
        className="btn-warm w-full"
      >
        {resent
          ? "Verification Email Sent"
          : resending
          ? "Sending..."
          : "Resend Verification Email"}
      </button>

      {resent && (
        <p className="text-center text-xs text-success mt-3">
          Check your inbox — a new link is on the way.
        </p>
      )}
    </>
  );
}

export default function VerifyPendingPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <p className="text-center text-sm text-mono-light">Loading...</p>
        }
      >
        <VerifyPendingContent />
      </Suspense>
    </AuthLayout>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { AuthLayout } from "@/components/AuthLayout";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "session_exchange_failed") {
      setError("Sign-in link expired or invalid. Please sign in again or request a new link.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setError(getAuthErrorMessage(signInError, "login"));
        setLoading(false);
        return;
      }

      if (data.session) {
        router.refresh();
        router.push("/inbox");
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not connect. Check your network and try again.";
      setError(getAuthErrorMessage({ message }, "connection"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <p className="text-center text-sm text-mono-medium mb-8">
        Sign in to review your business deductions.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-mono-light hover:text-mono-medium transition-colors"
            tabIndex={-1}
          >
            <span className="material-symbols-rounded text-[20px]">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>

        <div className="text-right">
          <button
            type="button"
            onClick={() => {
              setForgotPassword(true);
              setError(null);
              setResetSent(false);
            }}
            className="text-xs text-mono-light hover:text-accent-navy transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {forgotPassword && (
          <div className="rounded-lg border border-bg-tertiary bg-bg-secondary p-3 space-y-2">
            <p className="text-sm text-mono-dark font-medium">Send reset link</p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={resetLoading}
                onClick={async () => {
                  const e = email.trim();
                  if (!e) {
                    setError("Enter your email.");
                    return;
                  }
                  setResetLoading(true);
                  setError(null);
                  try {
                    const res = await fetch("/api/auth/forgot-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: e }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.status === 429) {
                      setError(data.error ?? "Too many attempts. Try again later.");
                      setResetLoading(false);
                      return;
                    }
                    if (res.status !== 200) {
                      setError(data.error ?? "Request failed.");
                      setResetLoading(false);
                      return;
                    }
                    const supabase = createSupabaseClient();
                    await supabase.auth.resetPasswordForEmail(e, {
                      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/reset-password`,
                    });
                    setResetSent(true);
                  } catch {
                    setError("Could not send reset link. Try again.");
                  } finally {
                    setResetLoading(false);
                  }
                }}
                className="btn-warm flex-1 text-sm py-2"
              >
                {resetLoading ? "Sending..." : "Send link"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotPassword(false);
                  setResetSent(false);
                  setError(null);
                }}
                className="text-sm text-mono-medium hover:text-mono-dark px-3 py-2"
              >
                Cancel
              </button>
            </div>
            {resetSent && (
              <p className="text-xs text-green-600">
                If an account exists for that email, we&apos;ve sent a reset link.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-danger bg-bg-secondary border border-bg-tertiary p-3 rounded-lg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-warm w-full"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-sm text-mono-medium text-center">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-accent-navy font-medium">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

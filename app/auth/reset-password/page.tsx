"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { validatePassword } from "@/lib/validation/password";
import { AuthLayout } from "@/components/AuthLayout";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setReady(true);
      } else {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const check = validatePassword(password);
    if (!check.valid) {
      setError(check.message ?? "Password does not meet requirements.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      router.push("/login?reset=success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready && !error) {
    return (
      <AuthLayout>
        <p className="text-center text-sm text-mono-medium">Checking link...</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <p className="text-center text-sm text-mono-medium mb-8">
        Set a new password for your account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <input
          type="password"
          required
          minLength={8}
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="auth-input"
        />

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
          {loading ? "Updating..." : "Set new password"}
        </button>
      </form>

      <p className="mt-6 text-sm text-mono-medium text-center">
        <Link href="/login" className="text-accent-navy font-medium">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

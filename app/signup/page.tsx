"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { AuthLayout } from "@/components/AuthLayout";
import { validatePassword, getPasswordStrength } from "@/lib/validation/password";
import Link from "next/link";

const BUSINESS_TYPES = [
  "Sole Proprietor",
  "Single-member LLC",
  "S-Corp",
  "Partnership",
  "C-Corp",
  "Other",
];

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [businessType, setBusinessType] = useState("");
  const [noBusinessYet, setNoBusinessYet] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!agreedToTerms) {
      setError("Please agree to the Terms & Conditions to continue.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      setError(passwordCheck.message ?? "Password does not meet requirements.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            business_type: noBusinessYet ? null : businessType,
            email_opt_in: emailOptIn,
            terms_accepted_at: new Date().toISOString(),
          },
        },
      });

      if (signUpError) {
        setError(getAuthErrorMessage(signUpError, "signup"));
        setLoading(false);
        return;
      }

      // Send custom verification email
      try {
        await fetch("/api/email/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), userId: data.user?.id }),
        });
      } catch {
        // Verification email is best-effort
      }

      router.push("/auth/verify-pending?email=" + encodeURIComponent(email.trim()));
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
        Track and maximize your business deductions.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Name row */}
        <div className="flex gap-3">
          <input
            type="text"
            required
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="auth-input flex-1"
          />
          <input
            type="text"
            required
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="auth-input flex-1"
          />
        </div>

        {/* Email */}
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
        />

        {/* Password */}
        <div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              placeholder="Password (12+ chars, or 8+ with upper, lower, number, symbol)"
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
          {password && (
            <p className={`mt-1 text-xs ${getPasswordStrength(password) === "weak" ? "text-red-600" : getPasswordStrength(password) === "fair" ? "text-amber-600" : "text-green-600"}`}>
              Strength: {getPasswordStrength(password)}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            required
            minLength={8}
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="auth-input pr-12"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-mono-light hover:text-mono-medium transition-colors"
            tabIndex={-1}
          >
            <span className="material-symbols-rounded text-[20px]">
              {showConfirm ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>

        {/* Business type selector */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: noBusinessYet ? "var(--color-mono-light)" : "var(--color-accent-terracotta)" }}
            />
            <span className="text-sm text-mono-dark font-medium">
              What type of business do you have?
            </span>
          </div>

          {!noBusinessYet && (
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("business-type-select");
                if (el) (el as HTMLSelectElement).showPicker?.();
              }}
              className="w-full rounded-lg border border-accent-terracotta/30 bg-white px-4 py-3 text-sm text-left transition hover:border-accent-terracotta/60 relative"
            >
              <select
                id="business-type-select"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              >
                <option value="">+ Select Your Business Type</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className={businessType ? "text-mono-dark" : "text-accent-terracotta"}>
                {businessType || "+ Select Your Business Type"}
              </span>
            </button>
          )}

          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={noBusinessYet}
              onChange={(e) => {
                setNoBusinessYet(e.target.checked);
                if (e.target.checked) setBusinessType("");
              }}
              className="w-4 h-4 rounded border-bg-tertiary accent-accent-sage"
            />
            <span className="text-sm text-mono-medium">
              I don&apos;t have a registered business yet
            </span>
          </label>
        </div>

        {/* Email opt-in */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-medium text-mono-dark">
            I&apos;d like to receive emails from ExpenseTerminal
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={emailOptIn}
            onClick={() => setEmailOptIn(!emailOptIn)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              emailOptIn ? "bg-accent-sage" : "bg-bg-tertiary"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                emailOptIn ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Terms agreement */}
        <label className="flex items-start gap-2 pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-bg-tertiary accent-accent-sage"
          />
          <span className="text-sm text-mono-medium">
            I agree to the{" "}
            <Link href="/terms" className="text-accent-navy underline">
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-accent-navy underline">
              Privacy Policy
            </Link>
          </span>
        </label>

        {/* Error */}
        {error && (
          <p className="text-sm text-danger bg-bg-secondary border border-bg-tertiary p-3 rounded-lg">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-warm w-full mt-2"
        >
          {loading ? "Creating account..." : "Get Started"}
        </button>
      </form>

      <p className="mt-6 text-sm text-mono-medium text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-accent-navy font-medium">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}

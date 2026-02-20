"use client";

import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left half — warm lifestyle panel */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(145deg, #a67c5b 0%, #8b6347 35%, #6b4a35 70%, #4a3225 100%)",
          }}
        />
        <div className="absolute inset-0 flex items-end p-12">
          <div>
            <p className="text-white/90 font-display text-2xl leading-snug mb-2">
              Track every deduction.<br />
              File with confidence.
            </p>
            <p className="text-white/50 text-sm">
              AI-powered expense tracking for small businesses
            </p>
          </div>
        </div>
      </div>

      {/* Right half — form area */}
      <div className="flex-1 flex flex-col bg-bg-secondary min-h-screen overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-12">
          {/* Logo / loader spinner */}
          <div className="mb-8">
            <svg
              className="w-12 h-12 text-mono-light animate-spin-slow"
              viewBox="0 0 50 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = i * 30;
                const opacity = 0.15 + (i / 12) * 0.85;
                const x1 = 25 + 14 * Math.cos((angle * Math.PI) / 180);
                const y1 = 25 + 14 * Math.sin((angle * Math.PI) / 180);
                const x2 = 25 + 20 * Math.cos((angle * Math.PI) / 180);
                const y2 = 25 + 20 * Math.sin((angle * Math.PI) / 180);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity={opacity}
                  />
                );
              })}
            </svg>
          </div>

          {/* App name — link to landing */}
          <h1 className="font-display text-2xl text-mono-dark mb-1 tracking-tight">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              ExpenseTerminal
            </Link>
          </h1>

          {/* Form content */}
          <div className="w-full max-w-[420px] mt-6">{children}</div>
        </div>

        {/* Footer */}
        <div className="text-center pb-6 px-6">
          <p className="text-xs text-mono-light">
            By using this app, you agree to our{" "}
            <Link href="/privacy" className="underline hover:text-mono-medium transition-colors">
              privacy policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="underline hover:text-mono-medium transition-colors">
              terms of use
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

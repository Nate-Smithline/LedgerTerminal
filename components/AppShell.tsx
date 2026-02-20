"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

const AUTH_ROUTES = ["/login", "/signup", "/auth", "/terms", "/privacy", "/cookies"];
const FULL_WIDTH_ROUTES = ["/"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isFullWidth = FULL_WIDTH_ROUTES.includes(pathname);

  if (isAuthPage || isFullWidth) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-bg-secondary">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-14 py-14">
        <div className="max-w-[880px] mx-auto">{children}</div>
      </main>
    </div>
  );
}

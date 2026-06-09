'use client';

import { AuthBrand } from "./AuthBrand";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[45%_1fr]">
      {/* Left: brand panel — hidden on mobile */}
      <div className="hidden md:block">
        <AuthBrand />
      </div>

      {/* Right: form pane */}
      <div className="flex flex-col items-center justify-center bg-surface-bg px-10 py-10 overflow-y-auto min-h-screen">
        {children}
      </div>
    </div>
  );
}

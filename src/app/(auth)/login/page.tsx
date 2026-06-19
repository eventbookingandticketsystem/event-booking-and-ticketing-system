'use client';

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/Auth/AuthLayout";
import { LoginForm } from "@/components/Auth/LoginForm";
import { ROUTES } from "@/constants/routes";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bannerParam = searchParams.get("banner");

  // Pre-set informational banners from URL params
  let banner: { tone: "success" | "info"; message: string } | null = null;
  if (bannerParam === "booking") {
    banner = { tone: "info", message: "Sign in to complete your booking." };
  } else if (bannerParam === "registered") {
    banner = { tone: "success", message: "Account created. Sign in to continue." };
  }

  return (
    <AuthLayout>
      <LoginForm
        onRegister={() => router.push(ROUTES.REGISTER)}
        onForgot={() => router.push(ROUTES.FORGOT_PASSWORD)}
        banner={banner}
      />
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-[45%_1fr]">
          <div className="hidden md:block bg-brand-navy" />
          <div className="flex items-center justify-center bg-surface-bg">
            <div className="w-[410px] h-[480px] skeleton rounded-lg" />
          </div>
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}

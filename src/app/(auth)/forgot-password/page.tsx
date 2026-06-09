'use client';

import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/Auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/Auth/ForgotPasswordForm";
import { ROUTES } from "@/constants/routes";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <AuthLayout>
      <ForgotPasswordForm onSignIn={() => router.push(ROUTES.LOGIN)} />
    </AuthLayout>
  );
}

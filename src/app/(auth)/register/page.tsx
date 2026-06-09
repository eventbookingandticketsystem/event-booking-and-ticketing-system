'use client';

import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/Auth/AuthLayout";
import { RegisterForm } from "@/components/Auth/RegisterForm";
import { ROUTES } from "@/constants/routes";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <AuthLayout>
      <RegisterForm
        onSuccess={() => router.push(ROUTES.LOGIN + "?banner=registered")}
        onSignIn={() => router.push(ROUTES.LOGIN)}
      />
    </AuthLayout>
  );
}

import { z } from "zod";

// PhoneValue sub-schema (mirrors PhoneValue from constants/countries.ts)
const phoneValueSchema = z.object({
  dial: z.string(),
  code: z.string(),
  num: z
    .string()
    .min(1, "Phone number is required")
    .min(7, "Enter a valid phone number")
    .regex(/^\d+$/, "Phone number must be digits only"),
});

// AUTH1 — Sign In
export const loginSchema = z.object({
  phone: phoneValueSchema,
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "At least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// AUTH2 — Register
export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: phoneValueSchema,
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["attendee", "organizer"], {
      error: "Select a role",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

// AUTH3 — Forgot Password
export const forgotPasswordSchema = z.object({
  phone: phoneValueSchema,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

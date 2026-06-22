import { z } from "zod";

// Zod v4: z.string().optional().or(z.literal("")) handles absent + empty-string + valid value.
// z.union([..., z.undefined()]) does NOT work in Zod v4 — undefined in a union
// requires an explicit undefined value, not an absent key.
const optionalEmail = z.string().email().optional().or(z.literal(""));
const optionalPhone = z.string().min(7).optional().or(z.literal(""));

export const registerSchema = z
  .object({
    name:     z.string().min(2),
    phone:    optionalPhone,
    email:    optionalEmail,
    password: z.string().min(8),
    role:     z.enum(["ATTENDEE", "ORGANIZER"]).default("ATTENDEE"),
    orgName:  z.string().optional(),
  })
  .refine((d) => d.email || d.phone, {
    message: "Either email or phone is required",
  });

export const loginSchema = z
  .object({
    email:    optionalEmail,
    phone:    optionalPhone,
    password: z.string().min(1),
  })
  .refine((d) => d.email || d.phone, {
    message: "Either email or phone is required",
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput    = z.infer<typeof loginSchema>;

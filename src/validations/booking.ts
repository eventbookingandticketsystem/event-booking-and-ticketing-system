import { z } from "zod";

// A3 — Booking Summary form
export const bookingSchema = z.object({
  // Each selected tier with quantity
  lines: z
    .array(
      z.object({
        id:        z.string(),
        name:      z.string(),
        price:     z.number().min(0),
        qty:       z.number().min(1, "Quantity must be at least 1"),
        remaining: z.number(),
      }),
    )
    .min(1, "Select at least one ticket"),
  method: z.enum(["mtn", "airtel"], {
    error: "Select a payment method",
  }),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;

// G9 — Manual Cash Entry (gate agent)
export const cashEntrySchema = z.object({
  name:     z.string().min(2, "Attendee name must be at least 2 characters"),
  category: z.string().min(1, "Select a ticket category"),
  amount:   z
    .string()
    .min(1, "Enter the amount paid")
    .regex(/^\d+$/, "Amount must be a number"),
});

export type CashEntryFormValues = z.infer<typeof cashEntrySchema>;

// O5 — Add Gate Agent modal
export const addAgentSchema = z.object({
  name:    z.string().min(2, "Name must be at least 2 characters"),
  phone: z.object({
    dial: z.string(),
    code: z.string(),
    num:  z
      .string()
      .min(1, "Phone number is required")
      .min(7, "Enter a valid phone number")
      .regex(/^\d+$/, "Phone number must be digits only"),
  }),
  event:   z.string().min(1, "Select an event"),
  gate:    z.string().min(1, "Enter gate or position"),
});

export type AddAgentFormValues = z.infer<typeof addAgentSchema>;

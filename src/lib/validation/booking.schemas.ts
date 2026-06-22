import { z } from "zod";

export const bookingLineSchema = z.object({
  tierId: z.string().min(1),
  qty:    z.number().int().min(1),
});

export const createBookingSchema = z.object({
  eventId: z.string().min(1),
  lines:   z.array(bookingLineSchema).min(1, "At least one tier is required"),
  method:  z.enum(["MTN", "AIRTEL", "CASH"]),
});

export const updateBookingSchema = z.object({
  status: z.enum(["CONFIRMED", "FAILED", "EXPIRED"]),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

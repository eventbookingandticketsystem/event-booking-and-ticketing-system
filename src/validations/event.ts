import { z } from "zod";

// Ticket category sub-schema (used in O3 Create Event step 2)
const ticketCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  price: z.number().min(0, "Price must be 0 or more"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  saleOpens: z.string().min(1, "Sale opens date is required"),
  saleCloses: z.string().min(1, "Sale closes date is required"),
});

// O3 — Create Event (3-step form, full schema for final validation)
export const createEventSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters"),
  venue: z.string().min(1, "Venue is required"),
  date: z
    .string()
    .min(1, "Pick a date")
    .refine((d) => new Date(d) > new Date(), "Date must be in the future"),
  time: z.string().min(1, "Time is required"),
  category: z.string().min(1, "Category is required"),
  categories: z
    .array(ticketCategorySchema)
    .min(1, "At least one ticket category is required"),
});

export type CreateEventFormValues = z.infer<typeof createEventSchema>;

// Step 1 only (for incremental validation)
export const eventStep1Schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters"),
  venue: z.string().min(1, "Venue is required"),
  date: z
    .string()
    .min(1, "Pick a date")
    .refine((d) => new Date(d) > new Date(), "Date must be in the future"),
  time: z.string().min(1, "Time is required"),
  category: z.string().min(1, "Category is required"),
});

export type EventStep1Values = z.infer<typeof eventStep1Schema>;

// Step 2 only
export const eventStep2Schema = z.object({
  categories: z
    .array(ticketCategorySchema)
    .min(1, "At least one ticket category is required"),
});

export type EventStep2Values = z.infer<typeof eventStep2Schema>;

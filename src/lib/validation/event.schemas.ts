import { z } from "zod";

export const tierSchema = z.object({
  name:       z.string().min(1),
  price:      z.number().min(0),
  capacity:   z.number().int().min(1),
  saleOpens:  z.string().datetime().optional(),
  saleCloses: z.string().datetime().optional(),
});

export const createEventSchema = z.object({
  title:       z.string().min(5),
  description: z.string().min(20).optional(),
  venue:       z.string().min(1),
  city:        z.string().optional().default("Juba"),
  date:        z.string().datetime(),
  time:        z.string().min(1),
  category:    z.string().min(1),
  poster:      z.string().optional(),
  about:       z.string().optional(),
  featured:    z.boolean().optional().default(false),
  tiers:       z.array(tierSchema).min(1, "At least one ticket tier is required"),
});

export const updateEventSchema = createEventSchema
  .omit({ tiers: true })
  .partial()
  .extend({
    status: z
      .enum(["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"])
      .optional(),
  });

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

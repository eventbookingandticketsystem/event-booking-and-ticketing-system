import { z } from "zod";

export const createAgentSchema = z.object({
  name:    z.string().min(2, "Name must be at least 2 characters"),
  phone:   z.string().min(7, "Enter a valid phone number"),
  gate:    z.string().min(1, "Gate assignment is required"),
  eventId: z.string().min(1, "Event is required"),
});

export const updateAgentSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;

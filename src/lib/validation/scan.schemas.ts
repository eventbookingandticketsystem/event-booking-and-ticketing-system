import { z } from "zod";

export const scanSchema = z.object({
  qrPayload: z.string().min(1, "QR payload is required"),
  eventId:   z.string().min(1, "Event ID is required"),
  gate:      z.string().min(1, "Gate is required"),
  agentId:   z.string().min(1, "Agent ID is required"),
});

export type ScanInput = z.infer<typeof scanSchema>;

// Read-only ticket lookup — no gate/agent needed since nothing is recorded.
export const lookupSchema = z.object({
  qrPayload: z.string().min(1, "QR payload is required"),
  eventId:   z.string().min(1, "Event ID is required"),
});

export type LookupInput = z.infer<typeof lookupSchema>;

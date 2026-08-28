import { useMutation } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse } from "../types";

// ── API response shapes — mirrors /api/scan/lookup ─────────────────────────

export interface LookupEvent {
  id:    string;
  title: string;
  venue: string;
  city:  string;
  date:  string;
}

export interface LookupValid {
  valid: true;
  ticket: {
    id:        string;
    ticketRef: string;
    tier:      string;
    status:    string;
    issuedAt:  string;
  };
  attendee: { name: string | null; email: string | null; phone: string | null };
  booking:  { ref: string; total: number; method: string };
  event:    LookupEvent;
}

interface LookupInvalid {
  valid:     false;
  result:    "ALREADY_USED" | "EXPIRED" | "WRONG_EVENT" | "INVALID" | "TOO_EARLY" | "EVENT_ENDED";
  message:   string;
  usedAt?:   string | null;
  opensAt?:  string;
  closedAt?: string;
  /** Present for every rejection except WRONG_EVENT and INVALID (no reliable event context yet). */
  event?:    LookupEvent;
}

export type LookupOutcome = LookupValid | LookupInvalid;

export interface LookupInput {
  /** Full colon-separated QR payload: "ticketRef:eventId:userId" */
  qrPayload: string;
  /** The event this scanner is validating against */
  eventId:   string;
}

/**
 * POST /api/scan/lookup — read-only ticket lookup for the pre-admit sidebar.
 * Does NOT mark the ticket as used and does NOT write a ScanRecord.
 * Use useScan() (POST /api/scan) to actually admit once the agent confirms.
 */
export function useScanLookup() {
  return useMutation<LookupOutcome, Error, LookupInput>({
    mutationFn: async (input: LookupInput): Promise<LookupOutcome> => {
      const res = await apiClient.post<ApiResponse<LookupOutcome>>("/scan/lookup", input);
      return res.data.data;
    },
  });
}

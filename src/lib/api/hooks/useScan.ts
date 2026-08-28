import { useMutation } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse } from "../types";

// ── API response shapes — verified against REAL /api/scan responses ────────────

/**
 * ADMIT: ticket is valid and has been marked USED.
 * OBSERVED: { result: "ADMIT", attendee: string, tier: string, ticketRef: string }
 */
interface ScanAdmit {
  result:     "ADMIT";
  attendee:   string;
  tier:       string;
  ticketRef:  string;
}

/**
 * ALREADY_USED: ticket was previously scanned.
 * OBSERVED: { result: "ALREADY_USED", message: string, usedAt: string }
 */
interface ScanAlreadyUsed {
  result:  "ALREADY_USED";
  message: string;
  usedAt:  string | null;
}

/**
 * EXPIRED: ticket is past the event date.
 * OBSERVED: { result: "EXPIRED", message: string }
 */
interface ScanExpired {
  result:  "EXPIRED";
  message: string;
}

/**
 * WRONG_EVENT: qrPayload encodes a different eventId than the scanner's event.
 * OBSERVED: { result: "WRONG_EVENT", message: string }
 */
interface ScanWrongEvent {
  result:  "WRONG_EVENT";
  message: string;
}

/**
 * TOO_EARLY: scanned before the event's admission window opens.
 * OBSERVED: { result: "TOO_EARLY", message: string, opensAt: string }
 */
interface ScanTooEarly {
  result:  "TOO_EARLY";
  message: string;
  opensAt: string;
}

/**
 * EVENT_ENDED: scanned after the event's admission window closed.
 * OBSERVED: { result: "EVENT_ENDED", message: string, closedAt: string }
 */
interface ScanEventEnded {
  result:   "EVENT_ENDED";
  message:  string;
  closedAt: string;
}

/**
 * INVALID: QR payload is malformed or ticket not found.
 * OBSERVED: { result: "INVALID", message: string }
 */
interface ScanInvalid {
  result:  "INVALID";
  message: string;
}

export type ScanOutcome =
  | ScanAdmit
  | ScanAlreadyUsed
  | ScanExpired
  | ScanWrongEvent
  | ScanTooEarly
  | ScanEventEnded
  | ScanInvalid;

// ── Input ─────────────────────────────────────────────────────────────────────

export interface ScanInput {
  /** Full colon-separated QR payload: "ticketRef:eventId:userId" */
  qrPayload: string;
  /** The event this scanner is validating against */
  eventId:   string;
  /** Gate label (e.g. "A", "Main Entrance") */
  gate:      string;
  /** The gate agent's DB id */
  agentId:   string;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * POST /api/scan — validate a QR code against the current event.
 *
 * Usage:
 *   const scan = useScan();
 *   scan.mutate({ qrPayload, eventId, gate, agentId });
 *
 * scan.data   → ScanOutcome (discriminated union — use .result to branch)
 * scan.isPending → boolean (show spinner / lock button)
 * scan.isError   → boolean (network error, not a scan rejection)
 * scan.error     → Error | null
 */
export function useScan() {
  return useMutation<ScanOutcome, Error, ScanInput>({
    mutationFn: async (input: ScanInput): Promise<ScanOutcome> => {
      const res = await apiClient.post<ApiResponse<ScanOutcome>>("/scan", input);
      return res.data.data;
    },
    // No queryClient invalidation needed here — the scanner page manages
    // admitted-count locally (optimistic +1 on ADMIT, no rollback on error).
    // The O1 dashboard refetches useOrgDashboard separately.
  });
}

// Booking and payment TypeScript interfaces

export type PaymentMethod = "mtn" | "airtel";
export type BookingStatus = "pending" | "confirmed" | "failed" | "expired";

export interface BookingLineItem {
  id: string;        // tier id
  name: string;      // tier name
  price: number;     // SSP per ticket
  qty: number;
  remaining: number; // capacity remaining (for validation)
}

export interface BookingType {
  id: string;           // "TKT-XXXXXX"
  eventId: string;
  lines: BookingLineItem[];
  method: PaymentMethod;
  total: number;         // SSP total including service fee
  status: BookingStatus;
  createdAt: string;
}

// Organizer dashboard data
export interface EntryRatePoint {
  t: string;  // "17:00"
  v: number;  // admissions count
}

export interface TierBreakdown {
  name: string;
  count: number;
  total: number;
  color: string;  // CSS color string or var()
}

export interface ScanRecord {
  time: string;   // "19:42:08"
  gate: string;   // "Gate A"
  tier: string;
  result: "ADMIT" | "REJECT";
}

export interface DashboardData {
  eventName: string;
  admitted: number;
  capacity: number;
  sold: number;
  fraud: number;
  revenue: number;    // SSP
  entryRate: EntryRatePoint[];
  tiers: TierBreakdown[];
  scans: ScanRecord[];
}

// Post-event report
export interface FraudRecord {
  time: string;
  gate: string;
  reason: string;
  frag: string;    // Ticket ID fragment
}

export interface ReportData {
  event: string;
  attended: number;
  revenue: number;
  fraud: number;
  duration: string;  // "1h 52m"
  entryRate: EntryRatePoint[];
  tiers: TierBreakdown[];
  fraudRows: FraudRecord[];
}

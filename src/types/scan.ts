// Scan and gate agent TypeScript interfaces
// Source of truth: design-reference/.../js/data.jsx + gate.jsx

export type ScanResult = "ADMIT" | "REJECT";
export type ScanKind = "admit" | "used" | "invalid" | "wrong" | "expired";

export interface AgentScanHistoryRecord {
  time: string;    // "19:42:08"
  event: string;
  result: ScanResult;
  id: string;      // "TIX-7K2M-9QX4"
}

// System health data
export type ServiceStatus = "Operational" | "Degraded" | "Down";

export interface ServiceRow {
  name: string;
  status: ServiceStatus;
  checked: string;  // "30s ago"
}

export interface ErrorLogRow {
  time: string;
  service: string;
  code: string;
  message: string;
  resolved: boolean;
}

export interface SystemHealthData {
  uptime: string;           // "99.7%"
  responseTime: string;     // "1.4s"
  failedCallbacks: number;
  services: ServiceRow[];
  errors: ErrorLogRow[];
}

// Admin overview data
export interface ActivityRecord {
  time: string;
  actor: string;
  action: string;
  status: "Completed" | "Pending" | "Upcoming";
}

export interface AdminOverviewData {
  organizers: number;
  activeToday: number;
  activeEvents: number;
  totalEvents: number;
  ticketsAllTime: number;
  fraud30d: number;
  salesTrend: Array<{ t: string; v: number }>;
  activity: ActivityRecord[];
}

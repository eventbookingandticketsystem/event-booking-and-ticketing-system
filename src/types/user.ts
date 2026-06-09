// User-related TypeScript interfaces
// Source of truth: design-reference/.../js/data.jsx ORGANIZERS + GATE_AGENTS

export type UserRole = "attendee" | "organizer" | "gate" | "admin";
export type OrganizerStatus = "Active" | "Suspended";
export type AgentStatus = "Active" | "Inactive";

export interface OrganizerType {
  id: string;           // "org-nile"
  name: string;         // Organisation display name
  contact: string;      // Contact person full name
  phone: string;        // "+211 922 700 145"
  org: string;          // Short org name
  events: number;       // Event count
  revenue: number;      // SSP
  status: OrganizerStatus;
  joined: string;       // "12 Aug 2025"
}

export interface GateAgentType {
  id: number;
  name: string;
  phone: string;        // "+211 922 481 003"
  event: string;        // Assigned event name
  gate: string;         // "Gate A"
  status: AgentStatus;
}

// Admin gate agent row — extends base with activity data
export interface AdminAgentType {
  id: number;
  name: string;
  phone: string;
  event: string;
  lastActive: string;   // "2 min ago"
  scansToday: number;
  status: AgentStatus;
}

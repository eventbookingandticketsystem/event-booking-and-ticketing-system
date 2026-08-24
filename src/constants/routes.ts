// All route path constants for the Tiketi application
// Map matches AGENTS.md Section 5 route group structure

export const ROUTES = {
  // Public
  HOME:    "/",
  EXPLORE: "/explore",
  EXPLORE_EVENT: (id: string) => `/explore/${id}`,

  // Auth
  LOGIN:           "/login",
  REGISTER:        "/register",
  FORGOT_PASSWORD: "/forgot-password",

  // Attendee (all under /dashboard)
  DASHBOARD:    "/dashboard",
  EVENT_DETAIL: (id: string) => `/dashboard/event/${id}`,
  BOOKING:      (id: string) => `/dashboard/booking/${id}`,
  PAYMENT:      (id: string) => `/dashboard/payment/${id}`,
  CONFIRMATION: "/dashboard/confirmation",
  TICKETS:      "/dashboard/tickets",
  TICKET_QR:    (id: string) => `/dashboard/tickets/${id}`,
  ACCOUNT:      "/dashboard/account",

  // Organizer
  ORGANIZER:            "/organizer",
  ORGANIZER_EVENTS:     "/organizer/events",
  ORGANIZER_CREATE:     "/organizer/events/create",
  ORGANIZER_EVENT:      (id: string) => `/organizer/events/${id}`,
  ORGANIZER_AGENTS:     "/organizer/gate-agents",
  ORGANIZER_REPORTS:    "/organizer/reports",
  ORGANIZER_SETTINGS:   "/organizer/settings",

  // Gate Agent
  AGENT:       "/agent",
  AGENT_SCAN:  "/agent/scanner",
  AGENT_CASH:  "/agent/cash-entry",

  // Admin
  ADMIN:          "/admin",
  ADMIN_ORGANIZERS:   "/admin/organizers",
  ADMIN_ORGANIZER:    (id: string) => `/admin/organizers/${id}`,
  ADMIN_EVENTS:       "/admin/events",
  ADMIN_GATE_AGENTS:  "/admin/gate-agents",
  ADMIN_HEALTH:       "/admin/health",
  ADMIN_SETTINGS:     "/admin/settings",
} as const;

// Type helpers
export type StaticRoute = Extract<
  (typeof ROUTES)[keyof typeof ROUTES],
  string
>;

// Shown to suspended accounts on the login screen so they know how to
// request reactivation — no in-app inquiry/messaging system exists yet.
export const SUPPORT_EMAIL = "support@tiketi.app";

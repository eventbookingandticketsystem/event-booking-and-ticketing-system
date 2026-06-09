import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

export type StatusValue =
  | "Valid" | "Admitted" | "Online" | "Active" | "Completed" | "Confirmed" | "Published" | "Live"
  | "Used" | "Expired" | "Past" | "Inactive" | "Draft" | "Archived"
  | "Selling Fast" | "Ongoing" | "Pending" | "Offline" | "Low stock"
  | "Sold Out" | "Rejected" | "Cancelled" | "Fraud"
  | "Upcoming";

const STATUS_TONE: Record<StatusValue, Tone> = {
  Valid:        "success",
  Admitted:     "success",
  Online:       "success",
  Active:       "success",
  Completed:    "success",
  Confirmed:    "success",
  Published:    "success",
  Live:         "success",
  Used:         "neutral",
  Expired:      "neutral",
  Past:         "neutral",
  Inactive:     "neutral",
  Draft:        "neutral",
  Archived:     "neutral",
  "Selling Fast": "warning",
  Ongoing:      "warning",
  Pending:      "warning",
  Offline:      "warning",
  "Low stock":  "warning",
  "Sold Out":   "danger",
  Rejected:     "danger",
  Cancelled:    "danger",
  Fraud:        "danger",
  Upcoming:     "info",
};

const toneClasses: Record<Tone, string> = {
  success: "bg-status-success-bg text-status-success",
  warning: "bg-status-warning-bg text-status-warning",
  danger:  "bg-status-danger-bg  text-status-danger",
  info:    "bg-status-info-bg    text-status-info",
  neutral: "bg-border            text-text-secondary",
  accent:  "bg-brand-orange/10  text-brand-orange",
};

interface StatusPillProps {
  status: StatusValue;
  pulse?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function StatusPill({ status, pulse = false, size = "md", className }: StatusPillProps) {
  const tone = STATUS_TONE[status] ?? "neutral";
  const isLive = status === "Live";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-pill font-body",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        toneClasses[tone],
        className,
      )}
    >
      {(pulse || isLive) && (
        <span className="relative flex h-[7px] w-[7px] shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
          <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-current" />
        </span>
      )}
      {status}
    </span>
  );
}

import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

type Tone = "success" | "danger" | "warning" | "info";

interface AlertBannerProps {
  tone?: Tone;
  title?: string;
  message: string;
  className?: string;
}

const toneConfig: Record<Tone, { bg: string; text: string; icon: "CircleCheck" | "CircleX" | "TriangleAlert" | "Info" }> = {
  success: { bg: "bg-status-success-bg border border-status-success/25", text: "text-status-success", icon: "CircleCheck" },
  danger:  { bg: "bg-status-danger-bg  border border-status-danger/25",  text: "text-status-danger",  icon: "CircleX" },
  warning: { bg: "bg-status-warning-bg border border-status-warning/25", text: "text-status-warning", icon: "TriangleAlert" },
  info:    { bg: "bg-status-info-bg    border border-status-info/25",    text: "text-status-info",    icon: "Info" },
};

export function AlertBanner({ tone = "info", title, message, className }: AlertBannerProps) {
  const cfg = toneConfig[tone];
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 items-start rounded-lg px-4 py-3 text-sm",
        cfg.bg,
        cfg.text,
        className,
      )}
    >
      <Icon name={cfg.icon} size={17} className="mt-0.5 shrink-0" />
      <div>
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <p className="leading-snug">{message}</p>
      </div>
    </div>
  );
}

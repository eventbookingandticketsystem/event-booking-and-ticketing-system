import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { type LucideProps, icons } from "lucide-react";

interface EmptyStateProps {
  icon?: keyof typeof icons;
  heading: string;
  subtext?: string;
  cta?: React.ReactNode;
  dark?: boolean;
  className?: string;
}

export function EmptyState({ icon = "Inbox", heading, subtext, cta, dark = false, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center text-center py-16 px-6", className)}>
      <div
        className={cn(
          "inline-flex items-center justify-center w-14 h-14 rounded-lg mb-4",
          dark ? "bg-white/8 text-white/50" : "bg-surface-bg text-text-muted",
        )}
      >
        <Icon name={icon} size={26} strokeWidth={1.5} />
      </div>
      <h3
        className={cn(
          "font-display font-semibold text-lg mb-1.5",
          dark ? "text-white" : "text-text",
        )}
      >
        {heading}
      </h3>
      {subtext && (
        <p className={cn("text-sm leading-relaxed mb-4", dark ? "text-white/50" : "text-text-secondary")}>
          {subtext}
        </p>
      )}
      {cta}
    </div>
  );
}

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  chipIcon: React.ReactNode;
  chipBg?: string;
  chipFg?: string;
  footDot?: string;
  footText?: string;
  progress?: number;       // 0–100
  progressColor?: string;  // Tailwind bg class e.g. "bg-brand-orange"
  className?: string;
}

export function StatCard({
  label,
  value,
  chipIcon,
  chipBg = "bg-brand-orange/10",
  chipFg = "text-brand-orange",
  footDot,
  footText,
  progress,
  progressColor = "bg-brand-orange",
  className,
}: StatCardProps) {
  return (
    <div className={cn("bg-surface border border-border rounded-lg shadow-stat p-5", className)}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5 font-body">
            {label}
          </p>
          <p className="font-display font-bold text-2xl text-text leading-none">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "shrink-0 inline-flex items-center justify-center w-9 h-9 rounded",
            chipBg,
            chipFg,
          )}
          aria-hidden="true"
        >
          {chipIcon}
        </div>
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="mb-2.5">
          <div className="h-1.5 w-full rounded-pill bg-border overflow-hidden">
            <div
              className={cn("h-full rounded-pill transition-all", progressColor)}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      {(footDot || footText) && (
        <div className="flex items-center gap-1.5 mt-1">
          {footDot && (
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ background: footDot }}
              aria-hidden="true"
            />
          )}
          {footText && (
            <span className="text-xs text-text-secondary font-body">{footText}</span>
          )}
        </div>
      )}
    </div>
  );
}

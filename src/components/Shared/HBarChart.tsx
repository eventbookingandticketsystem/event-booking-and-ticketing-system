import { cn } from "@/lib/utils";

interface HBarRow {
  label: string;
  value: number;
  color?: string;
}

interface HBarChartProps {
  data: HBarRow[];
  max?: number;
  className?: string;
  formatValue?: (v: number) => string;
}

export function HBarChart({
  data,
  max,
  className,
  formatValue = (v) => v.toLocaleString("en-US"),
}: HBarChartProps) {
  const maxVal = max ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("flex flex-col gap-3", className)} role="list" aria-label="Horizontal bar chart">
      {data.map((row, i) => {
        const pct = Math.round((row.value / maxVal) * 100);
        const barColor = row.color ?? "#FF5A00";
        return (
          <div key={i} role="listitem" className="flex items-center gap-3">
            <span className="shrink-0 w-28 text-xs font-medium text-text-secondary font-body truncate text-right">
              {row.label}
            </span>
            <div className="flex-1 h-6 rounded bg-surface-bg overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{ width: `${pct}%`, background: barColor }}
                role="progressbar"
                aria-valuenow={row.value}
                aria-valuemin={0}
                aria-valuemax={maxVal}
                aria-label={`${row.label}: ${formatValue(row.value)}`}
              />
            </div>
            <span className="shrink-0 w-14 text-xs font-semibold text-text font-body text-right">
              {formatValue(row.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  /** Render a full event card skeleton (poster + body) */
  variant?: "event" | "stat" | "row" | "text";
  lines?: number;
}

function Sk({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded", className)} />;
}

function EventCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
      <Sk className="w-full h-40" />
      <div className="p-4 space-y-2.5">
        <Sk className="h-3 w-16" />
        <Sk className="h-5 w-4/5" />
        <Sk className="h-3 w-3/5" />
        <Sk className="h-3 w-2/5" />
        <div className="flex items-center justify-between pt-1">
          <Sk className="h-4 w-20" />
          <Sk className="h-8 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-lg shadow-stat p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2">
          <Sk className="h-3 w-20" />
          <Sk className="h-8 w-28" />
        </div>
        <Sk className="h-9 w-9 rounded" />
      </div>
      <Sk className="h-2 w-full rounded-pill mb-2.5" />
      <Sk className="h-3 w-24" />
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Sk className="h-4 w-16" />
      <Sk className="h-4 w-20" />
      <Sk className="h-4 w-24" />
      <Sk className="h-5 w-14 rounded-pill ml-auto" />
    </div>
  );
}

function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Sk key={i} className={cn("h-4", i === lines - 1 ? "w-3/5" : "w-full")} />
      ))}
    </div>
  );
}

export function SkeletonCard({ variant = "event", lines = 3, className }: SkeletonCardProps) {
  return (
    <div className={className}>
      {variant === "event" && <EventCardSkeleton />}
      {variant === "stat" && <StatCardSkeleton />}
      {variant === "row" && <RowSkeleton />}
      {variant === "text" && <TextSkeleton lines={lines} />}
    </div>
  );
}

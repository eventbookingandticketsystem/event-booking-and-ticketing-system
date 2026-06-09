import { SkeletonCard } from "@/components/Shared/SkeletonCard";

export default function TicketsLoading() {
  return (
    <div className="flex flex-col">
      {/* Top bar skeleton */}
      <div className="px-[18px] pt-4 pb-3 border-b border-border">
        <div className="h-7 w-28 skeleton rounded" />
      </div>
      {/* Tabs skeleton */}
      <div className="h-[46px] mx-[18px] mt-3 skeleton rounded-md" />
      {/* Cards */}
      <div className="px-[18px] pt-4 pb-6 flex flex-col gap-3">
        <SkeletonCard variant="event" />
        <SkeletonCard variant="event" />
        <SkeletonCard variant="event" />
      </div>
    </div>
  );
}

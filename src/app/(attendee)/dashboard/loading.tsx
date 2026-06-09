import { SkeletonCard } from "@/components/Shared/SkeletonCard";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col">
      {/* Top bar skeleton */}
      <div className="flex items-center gap-3 px-[18px] pt-4 pb-3 border-b border-border">
        <div className="h-7 w-28 skeleton rounded flex-1" />
        <div className="w-[38px] h-[38px] skeleton rounded-full" />
      </div>

      {/* Search skeleton */}
      <div className="mx-[18px] mt-3">
        <div className="h-[46px] skeleton rounded-md" />
      </div>

      {/* Chips skeleton */}
      <div className="flex gap-2 px-[18px] py-3.5 overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[34px] w-20 skeleton rounded-pill shrink-0" />
        ))}
      </div>

      {/* Cards */}
      <div className="px-[18px] pb-6 flex flex-col gap-3">
        <SkeletonCard variant="event" />
        <div className="h-5 w-36 skeleton rounded my-2" />
        <SkeletonCard variant="event" />
        <SkeletonCard variant="event" />
        <SkeletonCard variant="event" />
      </div>
    </div>
  );
}

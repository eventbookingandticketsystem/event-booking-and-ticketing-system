import { cn } from "@/lib/utils";

function ExploreCardSkeleton({ fixed = false }: { fixed?: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden aspect-[3/4]",
        fixed ? "flex-none w-[248px]" : "w-full",
      )}
      style={{ background: "#0e1c29" }}
    >
      <div className="absolute inset-0 skeleton" style={{ borderRadius: 12 }} />
    </div>
  );
}

export default function ExploreLoading() {
  return (
    <div className="min-h-screen" style={{ background: "#060F18" }}>
      {/* Nav placeholder */}
      <div className="h-16 bg-brand-navy border-b border-white/8" />
      {/* Filters placeholder */}
      <div className="h-[140px] border-b" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(6,15,24,0.94)" }} />

      <div className="max-w-[1180px] mx-auto px-7 py-7">
        {/* Active events row */}
        <div className="mb-9">
          <div className="h-7 w-48 skeleton rounded mb-4" />
          <div className="flex gap-[18px] overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <ExploreCardSkeleton key={i} fixed />
            ))}
          </div>
        </div>
        {/* Upcoming grid */}
        <div>
          <div className="h-7 w-40 skeleton rounded mb-4" />
          <div className="grid grid-cols-4 gap-[18px] max-md:grid-cols-2 max-sm:grid-cols-1">
            {[0, 1, 2, 3].map((i) => (
              <ExploreCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

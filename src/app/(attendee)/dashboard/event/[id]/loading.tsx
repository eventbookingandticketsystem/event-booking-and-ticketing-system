export default function EventDetailLoading() {
  return (
    <div className="flex flex-col">
      {/* Poster skeleton */}
      <div className="h-[240px] skeleton rounded-none" />

      {/* Body skeleton */}
      <div className="px-[18px] pt-5 pb-4 flex flex-col gap-4">
        <div className="h-3 w-20 skeleton rounded" />
        <div className="h-7 w-4/5 skeleton rounded" />
        <div className="h-4 w-32 skeleton rounded" />

        {/* Info rows */}
        <div className="flex flex-col gap-3 mt-2">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-10 h-10 skeleton rounded-sm shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-16 skeleton rounded" />
                <div className="h-4 w-40 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* About skeleton */}
        <div className="h-px w-full bg-border" />
        <div className="h-5 w-36 skeleton rounded" />
        <div className="space-y-2">
          <div className="h-3 w-full skeleton rounded" />
          <div className="h-3 w-full skeleton rounded" />
          <div className="h-3 w-3/4 skeleton rounded" />
        </div>

        {/* Tiers skeleton */}
        <div className="h-px w-full bg-border" />
        <div className="h-5 w-20 skeleton rounded" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[86px] skeleton rounded-lg" />
        ))}
      </div>
    </div>
  );
}

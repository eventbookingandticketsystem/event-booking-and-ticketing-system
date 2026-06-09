export default function EventPreviewLoading() {
  return (
    <div className="min-h-screen" style={{ background: "#060F18" }}>
      {/* Nav placeholder */}
      <div className="h-16 bg-brand-navy border-b border-white/8" />

      <div className="max-w-[1080px] mx-auto pb-16">
        {/* Poster skeleton */}
        <div className="w-full skeleton" style={{ aspectRatio: "16/9", maxHeight: 420 }} />

        <div className="grid grid-cols-[1fr_360px] gap-8 px-7 pt-7 max-md:grid-cols-1">
          {/* Left skeleton */}
          <div className="space-y-4">
            <div className="h-5 w-24 skeleton rounded" />
            <div className="h-10 w-4/5 skeleton rounded" />
            <div className="space-y-3 mt-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-[42px] h-[42px] skeleton rounded-sm shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-16 skeleton rounded" />
                    <div className="h-5 w-40 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-2">
              <div className="h-6 w-40 skeleton rounded" />
              <div className="h-4 w-full skeleton rounded" />
              <div className="h-4 w-full skeleton rounded" />
              <div className="h-4 w-3/4 skeleton rounded" />
            </div>
          </div>

          {/* Right ticket card skeleton */}
          <div
            className="rounded-lg p-[22px]"
            style={{ background: "#0e1c29", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="h-6 w-24 skeleton rounded mb-5" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between py-4" style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.08)" } : undefined}>
                <div className="space-y-1.5">
                  <div className="h-4 w-24 skeleton rounded" />
                  <div className="h-3 w-20 skeleton rounded" />
                </div>
                <div className="space-y-2 items-end flex flex-col">
                  <div className="h-5 w-20 skeleton rounded" />
                  <div className="h-9 w-28 skeleton rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

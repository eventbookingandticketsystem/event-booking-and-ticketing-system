export default function OrgDashboardLoading() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Topbar skeleton */}
      <div className="h-14 bg-surface border-b border-border flex items-center px-6 gap-2">
        <div className="h-4 w-48 skeleton rounded" />
      </div>

      <div className="px-6 pt-5 pb-8 flex flex-col gap-6">
        {/* Header skeleton */}
        <div>
          <div className="h-7 w-72 skeleton rounded mb-2" />
          <div className="h-4 w-48 skeleton rounded" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-5">
              <div className="h-3 w-24 skeleton rounded mb-3" />
              <div className="h-8 w-28 skeleton rounded mb-4" />
              <div className="h-2 w-full skeleton rounded" />
            </div>
          ))}
        </div>

        {/* Line chart */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="h-5 w-28 skeleton rounded mb-4" />
          <div className="h-[200px] skeleton rounded" />
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-surface border border-border rounded-lg p-5">
            <div className="h-5 w-36 skeleton rounded mb-4" />
            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-3 w-24 skeleton rounded" />
                  <div className="flex-1 h-3 skeleton rounded" />
                  <div className="h-3 w-10 skeleton rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="h-14 border-b border-border px-5 flex items-center">
              <div className="h-5 w-28 skeleton rounded" />
            </div>
            <div className="flex flex-col gap-0">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                  <div className="h-3 w-14 skeleton rounded" />
                  <div className="h-3 w-16 skeleton rounded" />
                  <div className="h-3 w-20 skeleton rounded" />
                  <div className="h-5 w-20 skeleton rounded-pill" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

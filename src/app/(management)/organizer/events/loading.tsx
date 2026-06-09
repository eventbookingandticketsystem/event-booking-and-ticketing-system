export default function OrgEventsLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="h-14 bg-surface border-b border-border flex items-center px-6">
        <div className="h-4 w-40 skeleton rounded" />
      </div>

      <div className="px-6 pt-5 pb-8 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="h-7 w-40 skeleton rounded mb-2" />
            <div className="h-4 w-64 skeleton rounded" />
          </div>
          <div className="h-10 w-32 skeleton rounded-md" />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border pb-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-16 skeleton rounded" />
          ))}
        </div>

        {/* Table */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="border-b border-border bg-surface-bg px-5 py-3 flex gap-6">
            {[140, 80, 100, 100, 80, 80].map((w, i) => (
              <div key={i} className="skeleton rounded" style={{ width: w, height: 12 }} />
            ))}
          </div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-6 px-5 py-4 border-b border-border/50">
              <div className="h-4 w-36 skeleton rounded" />
              <div className="h-3 w-20 skeleton rounded" />
              <div className="h-3 w-24 skeleton rounded" />
              <div className="h-3 w-28 skeleton rounded" />
              <div className="h-5 w-20 skeleton rounded-pill" />
              <div className="h-8 w-24 skeleton rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

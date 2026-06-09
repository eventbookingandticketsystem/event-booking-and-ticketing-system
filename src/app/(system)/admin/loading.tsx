export default function AdminOverviewLoading() {
  return (
    <div className="px-6 pt-5 pb-10 flex flex-col gap-6" aria-busy="true" aria-label="Loading system overview">
      <div>
        <div className="h-7 w-60 skeleton rounded mb-2" />
        <div className="h-4 w-48 skeleton rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-5">
            <div className="h-3 w-24 skeleton rounded mb-3" />
            <div className="h-8 w-32 skeleton rounded mb-4" />
            <div className="h-2 w-full skeleton rounded" />
          </div>
        ))}
      </div>
      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="h-5 w-32 skeleton rounded mb-4" />
        <div className="h-[200px] skeleton rounded" />
      </div>
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="h-5 w-36 skeleton rounded" />
        </div>
        <div className="p-4 flex flex-col gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-5 skeleton rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

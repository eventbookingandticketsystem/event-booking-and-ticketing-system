export default function AgentLoading() {
  return (
    <div className="w-screen h-screen bg-brand-navy flex items-center justify-center p-4">
      <div className="w-full max-w-[390px] flex flex-col gap-6 p-8 rounded-2xl bg-white/5">
        {/* Brand row */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-white/10 skeleton-dark" />
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-28 rounded bg-white/10" />
            <div className="h-3 w-16 rounded bg-white/8" />
          </div>
        </div>
        {/* Agent row */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white/10" />
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-24 rounded bg-white/10" />
            <div className="h-3 w-36 rounded bg-white/8" />
          </div>
        </div>
        {/* Event selector */}
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="h-12 rounded-lg bg-white/8" />
        </div>
        {/* Status */}
        <div className="h-12 rounded-lg bg-white/10" />
        {/* Pills */}
        <div className="flex gap-2">
          {[0,1,2].map(i => <div key={i} className="flex-1 h-8 rounded-pill bg-white/10" />)}
        </div>
        {/* Button */}
        <div className="h-[52px] rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

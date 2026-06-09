import { Icon } from "@/components/Shared/Icon";

interface AdminTopbarProps {
  crumb: string;
  onCrumbRoot?: () => void;
}

export function AdminTopbar({ crumb, onCrumbRoot }: AdminTopbarProps) {
  return (
    <header className="flex items-center justify-between px-6 h-14 border-b border-border bg-surface shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <button
          type="button"
          onClick={onCrumbRoot}
          className="text-text-secondary hover:text-text transition-colors focus-visible:outline-none font-body"
        >
          Admin
        </button>
        <Icon name="ChevronRight" size={14} className="text-text-muted" />
        <span className="font-semibold text-text font-body">{crumb}</span>
      </div>

      {/* Right: role badge + avatar */}
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 rounded-pill text-[13px] font-semibold bg-status-danger-bg text-status-danger font-body">
          Admin
        </span>
        <div
          className="w-8 h-8 rounded-full bg-brand-navy inline-flex items-center justify-center text-[13px] font-bold text-white font-body shrink-0"
          aria-label="System Admin"
        >
          SA
        </div>
      </div>
    </header>
  );
}

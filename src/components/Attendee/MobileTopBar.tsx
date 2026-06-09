import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";

interface MobileTopBarProps {
  title: string;
  onBack?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export function MobileTopBar({ title, onBack, action, className }: MobileTopBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-[18px] py-4 bg-surface border-b border-border shrink-0",
        className,
      )}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="w-[38px] h-[38px] rounded-full border border-border bg-white text-text inline-flex items-center justify-center shrink-0 hover:bg-surface-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        >
          <Icon name="ArrowLeft" size={18} />
        </button>
      )}
      <h1 className="font-display font-semibold text-[18px] text-text flex-1 m-0">
        {title}
      </h1>
      {action}
    </div>
  );
}

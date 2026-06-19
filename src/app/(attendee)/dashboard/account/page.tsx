'use client';

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { type icons } from "lucide-react";

const MENU_ITEMS: { icon: keyof typeof icons; label: string; danger?: boolean }[] = [
  { icon: "Ticket",               label: "My bookings" },
  { icon: "Bell",                 label: "Notification preferences" },
  { icon: "CircleQuestionMark",   label: "Help & support" },
  { icon: "LogOut",               label: "Sign out", danger: true },
];

export default function AccountPage() {
  const router  = useRouter();
  const { data: session } = useSession();
  const user    = session?.user as Record<string, unknown> | undefined;
  const name    = (user?.name as string | undefined)  ?? "—";
  const phone   = (user?.phone as string | undefined) ?? "";
  // Initials from name: "Achol Deng" → "AD"
  const initials = name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "?";

  const handleItem = (label: string) => {
    if (label === "Sign out") {
      signOut({ redirect: true, callbackUrl: "/login" });
    }
  };

  return (
    <div className="flex flex-col">
      {/* Top bar — mobile only */}
      <div className="flex md:hidden items-center gap-3 px-[18px] pt-4 pb-3 bg-surface border-b border-border shrink-0">
        <h1 className="font-display font-semibold text-[22px] text-text flex-1 m-0">Account</h1>
      </div>

      {/* Content wrapper — centred on desktop */}
      <div className="w-full max-w-2xl mx-auto px-4 md:px-8 pt-2 pb-8">
        {/* Profile row — sourced from real session */}
        <div className="flex gap-3.5 items-center py-4 pb-6">
          <div
            className="w-16 h-16 rounded-full bg-brand-navy text-white inline-flex items-center justify-center font-display font-bold text-[22px] shrink-0"
            aria-label="User avatar"
          >
            {initials}
          </div>
          <div>
            <div className="font-display font-bold text-[19px] text-text">{name}</div>
            {phone && <div className="text-sm text-text-muted font-mono">{phone}</div>}
          </div>
        </div>

        {/* Menu card */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {MENU_ITEMS.map((item, i) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleItem(item.label)}
              aria-label={item.label}
              className={cn(
                "flex items-center gap-3.5 w-full px-4 py-4 text-left transition-colors min-h-[56px]",
                "hover:bg-surface-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange",
                i > 0 && "border-t border-border/50",
                item.danger ? "text-status-danger" : "text-text",
              )}
            >
              <Icon name={item.icon} size={19} className="shrink-0" />
              <span className="flex-1 font-medium text-[15px]">{item.label}</span>
              {!item.danger && (
                <Icon name="ChevronRight" size={17} className="text-text-muted shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Icon } from "@/components/Shared/Icon";
import { type LucideProps, icons } from "lucide-react";

const WHY_FEATURES: { icon: keyof typeof icons; title: string; body: string }[] = [
  {
    icon: "Shield",
    title: "Fraud-proof tickets",
    body: "Cryptographically signed QR codes. Impossible to duplicate or forge.",
  },
  {
    icon: "WifiOff",
    title: "Offline gate scanning",
    body: "Gates keep working with no internet. Scans sync automatically when back online.",
  },
  {
    icon: "Smartphone",
    title: "Mobile money payments",
    body: "Pay with MTN Mobile Money or Airtel Money. No bank card needed.",
  },
  {
    icon: "ChartBar",
    title: "Real-time analytics",
    body: "Track admissions, revenue, and fraud attempts live from your dashboard.",
  },
];

export function Features() {
  return (
    <section className="py-[72px] bg-surface-bg">
      <div className="max-w-[1120px] mx-auto px-7">
        <h2 className="font-display font-bold text-[32px] tracking-[-0.6px] text-center mb-11 max-md:text-[26px]">
          Built for the world
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[22px]">
          {WHY_FEATURES.map((feat) => (
            <div
              key={feat.title}
              className="flex gap-4 bg-surface border border-border rounded-md p-6 shadow-card"
            >
              <span className="inline-flex items-center justify-center w-[46px] h-[46px] rounded-sm bg-brand-navy text-white shrink-0">
                <Icon name={feat.icon} size={22} />
              </span>
              <div>
                <h3 className="font-display font-semibold text-lg text-text mb-1.5">
                  {feat.title}
                </h3>
                <p className="text-sm leading-[1.55] text-text-secondary">
                  {feat.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

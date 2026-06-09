import { Icon } from "@/components/Shared/Icon";
import { type LucideProps, icons } from "lucide-react";

const HOW_STEPS: { icon: keyof typeof icons; title: string; body: string }[] = [
  {
    icon: "Ticket",
    title: "Book your ticket",
    body: "Browse events, choose your tier, and pay with MTN or Airtel Money.",
  },
  {
    icon: "Smartphone",
    title: "Receive your QR",
    body: "Get your QR ticket instantly in-app or via SMS — no internet needed at the gate.",
  },
  {
    icon: "CircleCheck",
    title: "Scan and enter",
    body: "Gate agents scan your QR in under 2 seconds. Works even when offline.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-[72px] bg-surface">
      <div className="max-w-[1120px] mx-auto px-7">
        <h2 className="font-display font-bold text-[32px] tracking-[-0.6px] text-center mb-11 max-md:text-[26px]">
          How Tiketi works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[22px]">
          {HOW_STEPS.map((step, i) => (
            <div
              key={step.title}
              className="relative bg-surface border border-border rounded-md p-7 shadow-card"
            >
              {/* Step number */}
              <span className="absolute top-[18px] right-5 text-[28px] font-medium text-border font-mono">
                {String(i + 1).padStart(2, "0")}
              </span>
              {/* Icon */}
              <span className="inline-flex items-center justify-center w-[52px] h-[52px] rounded-md bg-brand-orange/10 text-brand-orange-deep mb-[18px]">
                <Icon name={step.icon} size={26} />
              </span>
              <h3 className="font-display font-semibold text-lg text-text mb-1.5">
                {step.title}
              </h3>
              <p className="text-sm leading-[1.55] text-text-secondary">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

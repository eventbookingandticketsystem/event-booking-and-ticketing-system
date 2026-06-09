import { Icon } from "@/components/Shared/Icon";
import { type LucideProps, icons } from "lucide-react";

const EVENT_TYPES: { icon: keyof typeof icons; label: string; body: string }[] = [
  { icon: "Music",          label: "Concerts",          body: "From arenas to intimate venues." },
  { icon: "Trophy",         label: "Football matches",  body: "Stadium turnstiles, sorted." },
  { icon: "Users",          label: "Church conferences",body: "Seat thousands with ease." },
  { icon: "GraduationCap", label: "Graduations",        body: "Guest tickets, allocated cleanly." },
];

export function EventTypes() {
  return (
    <section className="py-[72px] bg-surface">
      <div className="max-w-[1120px] mx-auto px-7">
        <h2 className="font-display font-bold text-[32px] tracking-[-0.6px] text-center mb-11 max-md:text-[26px]">
          For every event around you and beyond
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[18px] max-sm:grid-cols-1">
          {EVENT_TYPES.map((type) => (
            <div
              key={type.label}
              className="bg-surface-bg border border-border rounded-md p-[22px] text-left"
            >
              <span className="inline-flex items-center justify-center w-[42px] h-[42px] rounded-sm bg-surface border border-border text-brand-navy mb-3.5">
                <Icon name={type.icon} size={20} />
              </span>
              <h3 className="font-display font-semibold text-base text-brand-navy mb-1">
                {type.label}
              </h3>
              <p className="text-sm leading-[1.55] text-text-secondary">
                {type.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

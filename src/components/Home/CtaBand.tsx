'use client';

import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";

interface CtaBandProps {
  onSignIn: () => void;
  onRegister: () => void;
}

export function CtaBand({ onSignIn, onRegister }: CtaBandProps) {
  return (
    <section
      className="py-[72px] text-white"
      style={{
        background:
          "radial-gradient(900px 400px at 50% 120%, #0d3047 0%, transparent 60%), #08283B",
      }}
    >
      <div className="max-w-[1120px] mx-auto px-7 text-center">
        <h2 className="font-display font-bold text-[34px] tracking-[-0.6px] m-0">
          Ready to run better events?
        </h2>
        <div className="flex flex-col items-center gap-4 mt-6">
          <Button size="lg" onClick={onRegister} className="gap-2">
            Get started
            <Icon name="ArrowRight" size={18} />
          </Button>
          <button
            type="button"
            onClick={onSignIn}
            className="text-[15px] text-white/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
          >
            Or sign in to your account
          </button>
        </div>
      </div>
    </section>
  );
}

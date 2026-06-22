// Server component — exports dynamic so Next.js never attempts to statically
// prerender any route inside (validation)/. All agent pages are authenticated
// and real-time; static generation is not applicable.
export const dynamic = "force-dynamic";

import ValidationShell from "./ValidationShell";

export default function ValidationLayout({ children }: { children: React.ReactNode }) {
  return <ValidationShell>{children}</ValidationShell>;
}

export const dynamic = "force-dynamic";

import SystemShell from "./SystemShell";

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return <SystemShell>{children}</SystemShell>;
}

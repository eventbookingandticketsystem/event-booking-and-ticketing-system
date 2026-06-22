export const dynamic = "force-dynamic";

import ManagementShell from "./ManagementShell";

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return <ManagementShell>{children}</ManagementShell>;
}

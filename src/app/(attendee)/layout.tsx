export const dynamic = "force-dynamic";

import AttendeeShell from "./AttendeeShell";

export default function AttendeeLayout({ children }: { children: React.ReactNode }) {
  return <AttendeeShell>{children}</AttendeeShell>;
}

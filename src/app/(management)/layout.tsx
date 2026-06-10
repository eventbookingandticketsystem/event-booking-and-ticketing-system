'use client';

import { useRouter, usePathname } from "next/navigation";
import { OrgSidebar } from "@/components/Organizer/OrgSidebar";
import { ROUTES } from "@/constants/routes";
import { Icon } from "@/components/Shared/Icon";
import { Button } from "@/components/Shared/Button";

function getActiveNav(pathname: string): string {
  if (pathname.startsWith("/organizer/events/create")) return "create";
  if (pathname.startsWith("/organizer/events")) return "events";
  if (pathname.startsWith("/organizer/gate-agents")) return "agents";
  if (pathname.startsWith("/organizer/reports")) return "reports";
  if (pathname.startsWith("/organizer/settings")) return "settings";
  return "dashboard";
}

const NAV_ROUTES: Record<string, string> = {
  dashboard: "/organizer",
  events:    "/organizer/events",
  create:    "/organizer/events/create",
  agents:    "/organizer/gate-agents",
  reports:   "/organizer/reports",
  settings:  "/organizer/settings",
};

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const activeNav = getActiveNav(pathname);

  const handleNav = (id: string) => {
    const route = NAV_ROUTES[id];
    if (route) router.push(route);
  };

  return (
    <>
      {/* Mobile fallback */}
      <div className="flex lg:hidden min-h-screen items-center justify-center bg-surface-bg px-6">
        <div className="flex flex-col items-center text-center gap-5 max-w-sm">
          <span className="w-16 h-16 rounded-lg bg-brand-orange inline-flex items-center justify-center">
            <Icon name="Ticket" size={32} className="text-white" />
          </span>
          <div>
            <h1 className="font-display font-bold text-2xl text-text mb-2">Tiketi Organizer</h1>
            <p className="text-text-secondary text-base">
              The organizer dashboard is designed for desktop. Please open this page on a screen wider than 1024px.
            </p>
          </div>
          <Button onClick={() => router.push(ROUTES.LOGIN)}>Sign in on desktop</Button>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex h-screen overflow-hidden w-full">
        {/* Fixed sidebar */}
        <div className="fixed top-0 left-0 h-screen z-30">
          <OrgSidebar active={activeNav} onNav={handleNav} />
        </div>

        {/* Main area — offset by sidebar, fills remaining height */}
        <div className="flex flex-col flex-1 ml-[220px] h-screen overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-surface-bg">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

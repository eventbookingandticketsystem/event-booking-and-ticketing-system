'use client';

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

/**
 * The organizer detail view is rendered inline on /admin/organizers
 * via selected state — this dedicated route is not used.
 * Redirect back to the organizers list.
 */
export default function AdminOrganizerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/organizers");
  }, [id, router]);

  return null;
}

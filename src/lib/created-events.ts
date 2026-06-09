import type { OrgEventRow } from "@/types/event";

export let CREATED_EVENTS: OrgEventRow[] = [];

export function addCreatedEvent(ev: OrgEventRow): void {
  CREATED_EVENTS = [ev, ...CREATED_EVENTS];
}

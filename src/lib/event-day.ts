// Shared calendar-day boundary helpers for event status/date logic.
// An event is considered "ongoing" for its entire calendar day (its
// Event.date's local day), not a fixed duration — used by the admin
// stats route, the admin events "Ongoing" filter, and the daily
// event-status-sync cron so all three agree on the same definition.

export function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

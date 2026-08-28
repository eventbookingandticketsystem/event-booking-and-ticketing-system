// Gate scanning is only allowed within a grace window around an event's
// listed start time (Event.date), since there is no explicit doors-open/
// doors-close field on the schema.
export const GATE_OPENS_BEFORE_MS = 2 * 60 * 60 * 1000; // 2h before start
export const GATE_CLOSES_AFTER_MS = 6 * 60 * 60 * 1000; // 6h after start

export type EventWindowStatus =
  | { state: "TOO_EARLY"; opensAt: Date }
  | { state: "EVENT_ENDED"; closedAt: Date }
  | { state: "OPEN" };

export function getEventWindowStatus(
  eventDate: Date,
  now: Date = new Date(),
): EventWindowStatus {
  const opensAt  = new Date(eventDate.getTime() - GATE_OPENS_BEFORE_MS);
  const closesAt = new Date(eventDate.getTime() + GATE_CLOSES_AFTER_MS);

  if (now < opensAt)  return { state: "TOO_EARLY", opensAt };
  if (now > closesAt) return { state: "EVENT_ENDED", closedAt: closesAt };
  return { state: "OPEN" };
}

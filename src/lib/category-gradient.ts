/**
 * category-gradient.ts
 *
 * Returns a CSS gradient string for a given event category.
 * Covers every category the create-event form supports, plus the
 * legacy mock-data keys, plus a sensible default.
 *
 * Gradients match the EXPLORE_POSTERS palette from the design reference.
 */

const GRADIENT_MAP: Record<string, string> = {
  // ── Create-event category names ───────────────────────────────────────────
  music:           "linear-gradient(157deg, #3a1d6e 0%, #241a52 45%, #0b1f3a 100%)",
  sports:          "linear-gradient(157deg, #0f5132 0%, #0c3a2a 48%, #08283B 100%)",
  conference:      "linear-gradient(140deg, #0b2b3d 0%, #466177 100%)",
  graduation:      "linear-gradient(135deg, #08283B 0%, #3a2d6b 70%, #A83900 150%)",
  church:          "linear-gradient(157deg, #5b1626 0%, #3a1320 48%, #0b1f3a 100%)",
  "food & drinks": "linear-gradient(157deg, #7a3b12 0%, #5a2f14 48%, #0b1f3a 100%)",
  "arts & culture":"linear-gradient(157deg, #155e63 0%, #123f4f 48%, #08283B 100%)",
  other:           "linear-gradient(135deg, #08283B 0%, #14506b 55%, #FF5A00 140%)",

  // ── Legacy mock-data keys ─────────────────────────────────────────────────
  concert:         "linear-gradient(135deg, #08283B 0%, #14506b 55%, #FF5A00 140%)",
  concert2:        "linear-gradient(150deg, #2a1a3f 0%, #6b2447 60%, #FF5A00 150%)",
  football:        "linear-gradient(135deg, #08283B 0%, #1A6B3C 110%)",
};

/**
 * Returns the gradient CSS string for `category`.
 * Case-insensitive. Falls back to the "other" gradient.
 */
export function categoryGradient(category: string): string {
  const key = category.trim().toLowerCase();
  return GRADIENT_MAP[key] ?? GRADIENT_MAP.other;
}

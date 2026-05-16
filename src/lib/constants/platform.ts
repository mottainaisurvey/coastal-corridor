/**
 * Platform-wide constants for Coastal Corridor statistics.
 *
 * SINGLE SOURCE OF TRUTH for all corridor measurements and platform stats.
 *
 * History: prior to Phase E (#47), three distinct values existed across ~15
 * locations in the codebase (788 km, 700.3 km, 700 km). 788 km was a legacy
 * figure that was never updated when the corridor measurement was revised.
 * All instances were consolidated here in Phase E.
 *
 * Canonical value: 700.3 km (confirmed by founder as current measurement).
 *
 * Usage guide:
 *   CORRIDOR_KM          — numeric, for calculations (map/page.tsx distances)
 *   CORRIDOR_KM_DISPLAY  — formatted string, for full-precision display
 *   CORRIDOR_KM_ROUNDED  — rounded string, for space-constrained contexts
 *                          (metadata descriptions, footer, invest page)
 *   CORRIDOR_DESTINATIONS — numeric count of active corridor destinations
 *
 * Do NOT add new constants to this file without a corresponding brief update.
 * Scope creep on constants files is a known risk.
 */

/** Canonical corridor length in kilometres (numeric, for calculations). */
export const CORRIDOR_KM = 700.3;

/** Formatted corridor length for full-precision display contexts. */
export const CORRIDOR_KM_DISPLAY = '700.3 km';

/**
 * Rounded corridor length for space-constrained display contexts
 * (e.g., metadata descriptions, footer copy, invest page taglines).
 */
export const CORRIDOR_KM_ROUNDED = '700 km';

/** Number of active destinations along the corridor. */
export const CORRIDOR_DESTINATIONS = 12;

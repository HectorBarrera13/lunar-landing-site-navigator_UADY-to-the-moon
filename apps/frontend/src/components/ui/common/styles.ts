/**
 * Shared Tailwind class sets for DESIGN.md ("Lunar Aerospace Telemetry"): flat matte surfaces,
 * 1px hairline borders, square corners, no glows, blurs or shadows.
 * Traffic-light colors never appear here: they are reserved for the Suitability Index.
 */

export const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-primary'

/** Floating module panel (telemetry card / viewport). */
export const PANEL = 'border border-line bg-panel text-ink'

/** Section header: Space Grotesk, uppercase, expanded tracking. */
export const SECTION_TITLE = 'font-display text-xs font-semibold uppercase tracking-[0.14em] text-ink'

/** Metric ID / small label: JetBrains Mono, uppercase, Arctic. */
export const LABEL = 'font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-primary'

/** Every number, time, or coordinate. */
export const MONO_NUM = 'font-mono tabular-nums'

export const BUTTON_PRIMARY = `inline-flex h-8 rounded items-center justify-center bg-primary px-3 font-display text-xs font-bold uppercase tracking-[0.08em] text-on-primary hover:bg-secondary active:bg-line-strong active:text-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-subtle ${FOCUS_RING}`

export const BUTTON_SECONDARY = `inline-flex h-8 rounded items-center justify-center border border-line-strong bg-chassis px-3 font-display text-xs font-semibold uppercase tracking-[0.08em] text-secondary hover:border-primary disabled:cursor-not-allowed disabled:border-line disabled:text-ink-subtle disabled:hover:border-line ${FOCUS_RING}`

export const ICON_BUTTON = `inline-flex size-7 rounded items-center justify-center border border-transparent text-ink-muted hover:border-line-strong hover:text-ink ${FOCUS_RING}`

/** Rectangular 20px status chip (DESIGN.md "Chips & Status Badges"). */
export const CHIP =
  'inline-flex h-5 items-center gap-1.5 border border-line bg-chassis px-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-ink-muted'

/** Form input / telemetry adjuster. */
export const INPUT = `h-8 border border-line bg-base px-2 font-mono text-xs tabular-nums text-secondary [color-scheme:dark] focus:border-primary focus:outline-none aria-[invalid=true]:border-line-strong ${FOCUS_RING}`

/** Toggle segment: pressed fills with the primary, idle stays on the chassis. */
export function segmentClass(active: boolean): string {
  return `inline-flex h-7 items-center justify-center px-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em] tabular-nums ${FOCUS_RING} ${
    active ? 'bg-primary text-on-primary' : 'bg-chassis text-ink-subtle hover:text-ink'
  }`
}

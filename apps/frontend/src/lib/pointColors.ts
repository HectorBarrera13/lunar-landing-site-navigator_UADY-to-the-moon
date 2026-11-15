/** Colors for user-picked points (distinct from the yellow preset-site color #f5c542). */
export const POINT_COLORS = ['#56b4e9', '#cc79a7', '#2fd1a0', '#d55e00', '#aab4c0'] as const

/** Palette slot of the neutral color used for temporary previews (not yet compared). */
export const PREVIEW_COLOR_INDEX = POINT_COLORS.length - 1

export function pointColor(colorIndex: number | undefined): string | null {
  return colorIndex === undefined ? null : (POINT_COLORS[colorIndex] ?? null)
}

export function pointLabel(colorIndex: number | undefined): string {
  if (colorIndex === PREVIEW_COLOR_INDEX) return 'Preview'
  return `Point ${(colorIndex ?? 0) + 1}`
}

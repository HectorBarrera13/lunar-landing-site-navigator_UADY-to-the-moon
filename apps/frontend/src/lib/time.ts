const DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
})

/** `31 Mar 2027, 14:00 UTC` */
export function formatUtc(isoUtc: string): string {
  return `${DATE_TIME.format(new Date(isoUtc))} UTC`
}

/** Duration as `3 d 04 h` / `5 h` (whole hours, matching the hourly series). */
export function formatDuration(ms: number): string {
  const hours = Math.max(0, Math.round(ms / 3_600_000))
  const days = Math.floor(hours / 24)
  const rest = hours % 24
  if (days === 0) return `${rest} h`
  return `${days} d ${String(rest).padStart(2, '0')} h`
}

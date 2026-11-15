export const MISSION_STRINGS = {
  groupLabel: 'Mission window',
  title: 'Starting date',
  returningTitle: 'Returning date',
  start: 'Start',
  end: 'End',
  startDate: 'Start date (UTC)',
  startHour: 'Start hour (UTC)',
  endDate: 'End date (UTC)',
  endHour: 'End hour (UTC)',
  utc: 'UTC',
  apply: 'Apply',
  errors: {
    startMissing: 'Enter a valid start date.',
    endMissing: 'Enter a valid end date.',
    outOfBounds: 'The window must stay within 1 Jan 2025 00:00 – 31 Dec 2035 23:00 UTC.',
    order: 'The end must be after the start.',
  },
} as const

import { MAX_COMPARED, useAppStore } from '@/store'
import { TOUR_STRINGS as S } from './strings'

/** What a step points at: a DOM element (`data-tour` selector), the globe area, or nothing. */
export type TourTarget = { selector: string } | { virtual: 'moon' } | null

export interface TourStep {
  id: string
  title: string
  text: string
  target: TourTarget
  /** Demo action run once when the step becomes active. */
  enter?: () => void
}

/** Sites used by the demo, by catalog id; any located sites fill in if one is missing. */
const SAMPLE_IDS = ['malapert-massif', 'haworth', 'peak-near-cabeus-b']

function sampleSites() {
  const located = useAppStore
    .getState()
    .sites.filter((site) => site.lat !== null && site.lon !== null)
  const preferred = SAMPLE_IDS.flatMap((id) => located.filter((site) => site.id === id))
  const rest = located.filter((site) => !SAMPLE_IDS.includes(site.id))
  return [...preferred, ...rest].slice(0, MAX_COMPARED)
}

function focusAndPin(index: number): void {
  const site = sampleSites()[index]
  if (site === undefined) return
  const { focusSite, addToCompare } = useAppStore.getState()
  focusSite(site)
  addToCompare()
}

/** Leaves the interface clean after the demo (also used by "Skip all"). */
export function resetDemoState(): void {
  const state = useAppStore.getState()
  state.compared.forEach((location) => state.removeFromCompare(location.id))
  state.clearSelection()
  state.closeSidebar()
  state.setHorizonPanelOpen(false)
}

export const TOUR_STEPS: TourStep[] = [
  { id: 'dates', ...S.steps.dates, target: { selector: '[data-tour="mission-dates"]' } },
  { id: 'apply', ...S.steps.apply, target: { selector: '[data-tour="mission-apply"]' } },
  { id: 'moon', ...S.steps.moon, target: { virtual: 'moon' } },
  {
    id: 'compare-card',
    ...S.steps.compareCard,
    target: { selector: '[data-tour="point-compare"]' },
    enter: () => {
      const site = sampleSites()[0]
      if (site !== undefined) useAppStore.getState().focusSite(site)
    },
  },
  {
    id: 'compare-sidebar',
    ...S.steps.compareSidebar,
    target: { selector: '[data-tour="compare-sidebar"]' },
    enter: () => useAppStore.getState().addToCompare(),
  },
  {
    id: 'compare-three',
    ...S.steps.compareThree,
    target: { selector: '[data-tour="compare-sidebar"]' },
    enter: () => {
      focusAndPin(1)
      focusAndPin(2)
    },
  },
  { id: 'criteria', ...S.steps.criteria, target: { selector: '[data-tour="criteria-more"]' } },
  { id: 'landing', ...S.steps.landing, target: { selector: '[data-tour="landing-button"]' } },
  { id: 'technical', ...S.steps.technical, target: { selector: '[data-tour="point-technical"]' } },
]

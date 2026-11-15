export const TOUR_STRINGS = {
  dialogLabel: 'Interface guide',
  continue: 'Continue',
  finish: 'Finish',
  skipAll: 'Skip all',
  stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
  steps: {
    dates: {
      title: 'Choose your mission dates',
      text: 'Set the starting date and the returning date of the mission, and the UTC hour for each of them.',
    },
    apply: {
      title: 'Apply the window',
      text: 'Press Apply to update the position of the Sun and the Earth for the mission window you chose.',
    },
    moon: {
      title: 'Select a point on the Moon',
      text: 'Click anywhere on the lit side of the Moon. The nearest landing site is selected and an information card appears.',
    },
    compareCard: {
      title: 'Pin a point to compare',
      text: 'This is the information card of a selected point. Press Compare to pin it. Here we selected an example site for you.',
    },
    compareSidebar: {
      title: 'The Compare panel',
      text: 'The pinned point now appears in the Compare panel, ranked by its Suitability Index.',
    },
    compareThree: {
      title: 'Compare up to 3 points',
      text: 'You can pin up to 3 points and compare them side by side. We added two more examples; the best Suitability Index comes first.',
    },
    criteria: {
      title: 'Criteria details',
      text: 'Each card lists the criteria behind the index. Press "More information" to see the percentage and the details of a criterion.',
    },
    landing: {
      title: 'Show landing site',
      text: 'With a point selected, press Show landing site to open the landing zone drawing of that point.',
    },
    technical: {
      title: 'Technical information',
      text: 'Press Technical information in the point card to open the local horizon panel with the Sun and Earth over time.',
    },
  },
} as const

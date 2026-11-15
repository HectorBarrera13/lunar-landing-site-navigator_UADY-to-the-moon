/** Store-level notices shown by the 2D layer; kept here so they can be translated (NFR-02). */
export const NOTICE_STRINGS = {
  farSide:
    'The far side never faces Earth, so a lander there has no direct-to-Earth link without relay satellites. Pick a point on the near side or south of 80° S.',
  nearestSiteUnavailable: 'The selected point could not be resolved to a precomputed preset site.',
} as const

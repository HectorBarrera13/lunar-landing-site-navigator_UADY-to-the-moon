/**
 * Official LROC NAC ROI browse mosaics for preset landing sites
 * (registry and attribution: `data/README.md`, section "Official landing site imagery").
 * Each image is centered on the site's coordinates but is illustrative: the zone overlay
 * is drawn to scale independently.
 */

export interface SiteImage {
  /** Path under `public/`, served by Vite. */
  src: string
  /** Official product page for attribution; null when the source page is not recorded yet. */
  productUrl: string | null
  /** Short credit label. */
  credit: string
  /** Alt text for the canvas base image context. */
  alt: string
}

const LROC_PRODUCT = 'https://data.lroc.im-ldi.com/lroc/view_rdr/'

function roi(file: string, product: string, name: string): SiteImage {
  return {
    src: `/images/sites/${file}.png`,
    productUrl: `${LROC_PRODUCT}${product}`,
    credit: 'NASA/GSFC/Arizona State University (LROC)',
    alt: `LROC NAC mosaic near ${name}`,
  }
}

/** Keys are catalog site IDs; sites without an entry keep the placeholder tile. */
export const SITE_IMAGES: Record<string, SiteImage> = {
  'peak-near-cabeus-b': roi('peak-near-cabeus-b', 'NAC_ROI_CABEUSPKLO2', 'Peak near Cabeus B'),
  haworth: roi('haworth', 'NAC_ROI_HAWORTH_LO1', 'Haworth'),
  'malapert-massif': roi('malapert-massif', 'NAC_ROI_MALAPERTLO1', 'Malapert Massif'),
  'mons-mouton-plateau': roi('mons-mouton-plateau', 'NAC_ROI_MOUTNPLTLO1', 'Mons Mouton Plateau'),
  'mons-mouton': roi('mons-mouton', 'NAC_ROI_MTMOUTONLO1', 'Mons Mouton'),
  'nobile-rim-2': roi('nobile-rim-2', 'NAC_ROI_NOBILE02LO1', 'Nobile Rim 2'),
  'de-gerlache-rim-2': roi('de-gerlache-rim-2', 'NAC_ROI_DEGERRIMLO1', 'de Gerlache Rim 2'),
  'slater-plain': roi('slater-plain', 'NAC_ROI_PSRSLATRLOA', 'Slater Plain'),
  'apollo-11': roi('apollo-11', 'NAC_ROI_APOLLO11LOA', 'Apollo 11'),
  'apollo-17': roi('apollo-17', 'NAC_ROI_APOLLO17LOA', 'Apollo 17'),
  'chandrayaan-3': roi('chandrayaan-3', 'NAC_ROI_VIKRAM__LOA', 'Chandrayaan-3 / Vikram crater'),
}

/** Team-provided image; source and license still to be recorded (see AI_LOG.md). */
SITE_IMAGES['change-3'] = {
  src: '/images/sites/change-3.png',
  productUrl: null,
  credit: 'Image provided by the team (source pending)',
  alt: "Lunar surface near Chang'e 3",
}

export function siteImage(siteId: string | null | undefined): SiteImage | null {
  if (siteId === null || siteId === undefined) return null
  return SITE_IMAGES[siteId] ?? null
}

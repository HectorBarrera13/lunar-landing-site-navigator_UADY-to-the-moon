import type { EvaluateRequest, EvaluateResponse, SiteListItem, SiteTimeSeries } from '@/types'
import { MOCK_SITES, buildMockEvaluation, buildMockSiteSeries } from '@/lib/api/mockData'

/** Base URL for the real backend; unused while the mock is active. */
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const MOCK_DELAY_MS = 400

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** GET /api/sites (MOCK until the backend is ready). */
export async function getSites(): Promise<SiteListItem[]> {
  await delay(MOCK_DELAY_MS)
  return MOCK_SITES.map((s) => ({ ...s }))
}

/** POST /api/evaluate (MOCK until the backend is ready). */
export async function evaluate(request: EvaluateRequest): Promise<EvaluateResponse> {
  await delay(MOCK_DELAY_MS)
  return buildMockEvaluation(request)
}

/** GET /api/sites/{site_id}/series?start=&end= (MOCK until the backend is ready). */
export async function getSiteSeries(siteId: string, startUtc?: string, endUtc?: string): Promise<SiteTimeSeries> {
  await delay(MOCK_DELAY_MS)
  return buildMockSiteSeries(siteId, startUtc, endUtc)
}

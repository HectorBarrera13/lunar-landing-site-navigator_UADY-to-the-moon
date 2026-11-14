import type { EvaluateRequest, EvaluateResponse, SiteListItem } from '@/types'
import { MOCK_SITES, buildMockEvaluation } from '@/lib/api/mockData'

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

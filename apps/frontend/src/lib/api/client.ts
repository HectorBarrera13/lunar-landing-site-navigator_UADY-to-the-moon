import type { EvaluateRequest, EvaluateResponse, SiteListItem, SiteTimeSeries } from '@/types'

/** Backend API root, matching `ARCHITECTURE.md` (`VITE_API_URL`). */
const DEFAULT_API_URL = 'http://localhost:8000/api'

export const API_URL: string = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function errorDetail(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string') {
      return body.detail
    }
  } catch {
    // Non-JSON error body; fall back to the HTTP status text below.
  }
  return response.statusText || `Request failed with status ${response.status}.`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, init)
  } catch {
    throw new ApiError(`Cannot reach the API at ${API_URL}. Is the backend running?`, 0)
  }
  if (!response.ok) throw new ApiError(await errorDetail(response), response.status)
  return (await response.json()) as T
}

/** GET /api/sites */
export async function getSites(): Promise<SiteListItem[]> {
  return request<SiteListItem[]>('/sites')
}

/** POST /api/evaluate */
export async function evaluate(body: EvaluateRequest): Promise<EvaluateResponse> {
  return request<EvaluateResponse>('/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** GET /api/sites/{site_id}/series?start=&end= */
export async function getSiteSeries(
  siteId: string,
  startUtc: string,
  endUtc: string,
): Promise<SiteTimeSeries> {
  const params = new URLSearchParams({ start: startUtc, end: endUtc })
  return request<SiteTimeSeries>(`/sites/${encodeURIComponent(siteId)}/series?${params.toString()}`)
}

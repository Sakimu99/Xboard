import { settings } from '@/lib/settings'
import { auth } from '@/lib/auth'
import { getLanguage } from '@/i18n'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

type Params = Record<string, string | number | boolean | null | undefined>

function buildUrl(path: string, params?: Params) {
  const url = `${settings.base_url}api/v1${path}`
  if (!params) return url
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') qs.set(k, String(v))
  })
  const s = qs.toString()
  return s ? `${url}?${s}` : url
}

function pickMessage(body: unknown, status: number): string {
  const b = body as { message?: string; errors?: Record<string, string[]> } | null
  const first = b?.errors && Object.values(b.errors)[0]?.[0]
  return first || b?.message || `Request failed (${status})`
}

async function request<T>(method: 'GET' | 'POST', path: string, params?: Params, body?: object): Promise<T> {
  const token = auth.get()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Language': getLanguage(),
  }
  if (token) headers.Authorization = token
  if (body) headers['Content-Type'] = 'application/json'

  const res = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    // 用戶端介面未登入或憑證失效時，後端回 401/403
    if ((res.status === 401 || res.status === 403) && path.startsWith('/user/') && token) {
      auth.set(null)
    }
    throw new ApiError(pickMessage(json, res.status), res.status)
  }
  return json as T
}

/** 大多數介面回傳 { status, message, data } */
export interface Envelope<T> {
  data: T
}

export const http = {
  get: <T>(path: string, params?: Params) => request<T>('GET', path, params),
  post: <T>(path: string, body?: object) => request<T>('POST', path, undefined, body ?? {}),
}

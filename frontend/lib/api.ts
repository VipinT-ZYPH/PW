const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
const REQUEST_TIMEOUT_MS = 10000

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: init.signal || controller.signal,
      headers: { Accept: 'application/json', ...init.headers },
    })
    if (!response.ok) {
      throw new ApiError(response.status, `Request failed with status ${response.status}`)
    }
    return await response.json() as T
  } finally {
    window.clearTimeout(timeout)
  }
}

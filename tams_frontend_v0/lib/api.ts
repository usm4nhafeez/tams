import axios from 'axios'
import { toast } from 'sonner'

// ─── Key transformers ────────────────────────────────────────────────────────

function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase())
}

function toSnakeCaseStr(str: string): string {
  return str.replace(/([A-Z])/g, (char) => `_${char.toLowerCase()}`)
}

/** Recursively converts all object keys from snake_case → camelCase */
export function camelizeKeys(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(camelizeKeys)
  if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([key, value]) => [
        toCamelCase(key),
        camelizeKeys(value),
      ])
    )
  }
  return data
}

/** Recursively converts all object keys from camelCase → snake_case.
 *  Skips FormData and Date instances. */
function snakelizeKeys(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(snakelizeKeys)
  if (
    data !== null &&
    typeof data === 'object' &&
    !(data instanceof FormData) &&
    !(data instanceof Date)
  ) {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([key, value]) => [
        toSnakeCaseStr(key),
        snakelizeKeys(value),
      ])
    )
  }
  return data
}

// ─── Axios instance ──────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1',
  timeout: 30000,
})

// Convert request body keys to snake_case (skip FormData — already keyed correctly)
api.interceptors.request.use((config) => {
  if (config.data && !(config.data instanceof FormData)) {
    config.data = snakelizeKeys(config.data)
  }
  return config
})

// Unwrap { success, data } envelope and convert response keys to camelCase
api.interceptors.response.use(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (response): any => {
    const wrapped = response.data
    if (wrapped && typeof wrapped === 'object' && 'success' in wrapped) {
      if (wrapped.success === false) {
        const message = wrapped.message || 'An error occurred'
        toast.error(message)
        return Promise.reject(new Error(message))
      }
      return camelizeKeys(wrapped.data)
    }
    return camelizeKeys(response.data)
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Please check your connection.'
    toast.error(message)
    return Promise.reject(error)
  }
)

export default api

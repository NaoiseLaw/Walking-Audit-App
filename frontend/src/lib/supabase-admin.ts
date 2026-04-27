import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazily initialised — module-level code must not throw so that
// `next build` succeeds even when env vars are absent at build time.
// The client is created on first use (i.e. inside an API route handler).
let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error(
        'Supabase admin credentials not configured. ' +
        'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
      )
    }
    _client = createClient(url, key, { auth: { persistSession: false } })
  }
  return _client
}

// Proxy that looks like a SupabaseClient to all callers but defers
// construction until the first property access (inside a request handler).
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop)
  },
})

/** Recursively convert snake_case object keys to camelCase */
export function toCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamel)
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
        toCamel(v),
      ])
    )
  }
  return obj
}

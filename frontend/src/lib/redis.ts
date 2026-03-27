// No-op Redis client — caching disabled in this Vercel deployment.
// All reads return null; all writes are silently skipped.
export const redis = {
  get: async (_key: string): Promise<string | null> => null,
  set: async (_key: string, _value: string): Promise<void> => {},
  setex: async (_key: string, _ttl: number, _value: string): Promise<void> => {},
  del: async (..._keys: string[]): Promise<void> => {},
}

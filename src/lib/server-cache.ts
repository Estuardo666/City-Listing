import * as React from 'react'

type Cacheable = (...args: never[]) => unknown

/**
 * React 19 exposes `cache` for server request memoization. The app still
 * supports React 18, where that export is absent; falling back to the
 * original function keeps API routes executable in Node and CI.
 */
export function serverCache<T extends Cacheable>(fn: T): T {
  const reactCache = (React as unknown as { cache?: (value: T) => T }).cache
  return typeof reactCache === 'function' ? reactCache(fn) : fn
}

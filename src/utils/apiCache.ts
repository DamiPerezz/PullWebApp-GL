/**
 * API Caching Utility
 * PERFORMANCE: In-memory cache for API responses with TTL
 * Reduces network requests and improves perceived performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh
}

// Default cache durations
export const CACHE_DURATIONS = {
  SHORT: 30 * 1000,      // 30 seconds - for dynamic data
  MEDIUM: 2 * 60 * 1000, // 2 minutes - for semi-static data
  LONG: 5 * 60 * 1000,   // 5 minutes - for static data like venues
  VERY_LONG: 15 * 60 * 1000, // 15 minutes - for rarely changing data
} as const;

class APICache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private pendingRequests = new Map<string, Promise<unknown>>();

  /**
   * Get cached data or fetch from API
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = { ttl: CACHE_DURATIONS.MEDIUM }
  ): Promise<T> {
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    const now = Date.now();

    // Return cached data if still valid
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    // If staleWhileRevalidate and we have stale data, return it and refresh in background
    if (config.staleWhileRevalidate && cached) {
      this.refresh(key, fetcher, config).catch(() => {
        // Silently ignore background refresh errors
      });
      return cached.data;
    }

    // Check if there's already a pending request for this key
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Fetch fresh data
    const promise = this.refresh(key, fetcher, config);
    this.pendingRequests.set(key, promise);

    try {
      return await promise;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Refresh cache with fresh data
   */
  private async refresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    const data = await fetcher();
    const now = Date.now();

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + config.ttl,
    });

    return data;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Get cache stats for debugging
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Preload data into cache
   */
  async preload<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = { ttl: CACHE_DURATIONS.LONG }
  ): Promise<void> {
    try {
      await this.get(key, fetcher, config);
    } catch {
      // Silently ignore preload errors
    }
  }
}

// Singleton instance
export const apiCache = new APICache();

/**
 * Cache key generators for consistent key naming
 */
export const cacheKeys = {
  venues: {
    all: () => 'venues:all',
    bySlug: (slug: string) => `venues:slug:${slug}`,
    events: (slug: string) => `venues:events:${slug}`,
    info: (slug: string) => `venues:info:${slug}`,
  },
  events: {
    all: () => 'events:all',
    bySlug: (slug: string) => `events:slug:${slug}`,
    detailed: (slug: string) => `events:detailed:${slug}`,
    tickets: (eventId: string) => `events:tickets:${eventId}`,
  },
  user: {
    profile: () => 'user:profile',
    wallet: () => 'user:wallet',
    orders: () => 'user:orders',
  },
};

/**
 * React hook for cached API calls
 * Usage: const { data, loading, error, refresh } = useCachedAPI(key, fetcher, config)
 */
export function createCachedFetcher<T>(
  key: string,
  fetcher: () => Promise<T>,
  config?: CacheConfig
): () => Promise<T> {
  return () => apiCache.get(key, fetcher, config);
}

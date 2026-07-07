/**
 * Route Prefetching Utility
 * PERFORMANCE: Preloads route chunks and data before navigation
 */

// Track prefetched routes to avoid duplicate requests
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a route's code chunk
 * Use on hover or when route is likely to be visited
 */
export function prefetchRoute(routePath: string): void {
  if (prefetchedRoutes.has(routePath)) return;
  prefetchedRoutes.add(routePath);

  // Map routes to their lazy-loaded modules
  const routeModules: Record<string, () => Promise<unknown>> = {
    '/venues': () => import('../pages/venues-page/venues-page'),
    '/login': () => import('../pages/login-page/login-page'),
    '/wallet': () => import('../pages/wallet-page/wallet-page'),
  };

  // Dynamic routes (with patterns)
  if (routePath.includes('/event/') && !routePath.includes('/tickets')) {
    import('../pages/event-detailed-page/event-detailed-page').catch(() => {});
  } else if (routePath.includes('/venues/') && routePath.includes('/events')) {
    import('../pages/venue-event-page/event-venue-page').catch(() => {});
  } else if (routeModules[routePath]) {
    routeModules[routePath]().catch(() => {});
  }
}

/**
 * Prefetch multiple routes at once
 * Call on initial page load for common navigation paths
 */
export function prefetchCommonRoutes(): void {
  // Use requestIdleCallback for non-blocking prefetch
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      prefetchRoute('/venues');
    }, { timeout: 2000 });
  } else {
    // Fallback: use setTimeout
    setTimeout(() => {
      prefetchRoute('/venues');
    }, 1000);
  }
}

/**
 * Prefetch on link hover
 * Add to NavLink components for instant navigation
 */
export function createPrefetchHandler(path: string): () => void {
  return () => prefetchRoute(path);
}

/**
 * Prefetch API data for a route
 * Use with apiCache for data preloading
 */
export async function prefetchRouteData(
  _routePath: string, // Reserved for future cache key usage
  dataFetchers: (() => Promise<unknown>)[]
): Promise<void> {
  try {
    // Run all prefetch requests in parallel
    await Promise.allSettled(dataFetchers.map(fetcher => fetcher()));
  } catch {
    // Silently ignore prefetch errors
  }
}

/**
 * Hook to prefetch on mount
 * Usage: usePrefetchOnMount(['/venues', '/events']);
 */
export function usePrefetchOnMount(routes: string[]): void {
  if (typeof window === 'undefined') return;

  // Use requestIdleCallback for non-blocking prefetch
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      routes.forEach(route => prefetchRoute(route));
    }, { timeout: 3000 });
  }
}

/**
 * Performance Hooks for PullWebApp
 * Optimized hooks for debouncing, throttling, and intersection observation
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDebounce - Delays updating a value until after a specified delay
 * Use for: Search inputs, form validation, API calls on input change
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback - Returns a debounced version of a callback
 * Use for: Event handlers that shouldn't fire too frequently
 *
 * @param callback - The callback to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced callback
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * useThrottle - Limits how often a value can update
 * Use for: Scroll handlers, resize handlers, mouse move handlers
 *
 * @param value - The value to throttle
 * @param limit - Minimum time between updates in milliseconds (default: 100ms)
 * @returns Throttled value
 */
export function useThrottle<T>(value: T, limit: number = 100): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * useIntersectionObserver - Observes when an element enters/exits the viewport
 * Use for: Lazy loading images, infinite scroll, animations on scroll
 *
 * @param options - IntersectionObserver options
 * @returns [ref, isIntersecting, entry]
 */
export function useIntersectionObserver<T extends Element>(
  options: IntersectionObserverInit = {}
): [React.RefObject<T | null>, boolean, IntersectionObserverEntry | null] {
  const elementRef = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  const { threshold = 0, root = null, rootMargin = '50px' } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin]);

  return [elementRef, isIntersecting, entry];
}

/**
 * useLazyLoad - Returns whether an element should load its content
 * Once true, stays true (for images that should stay loaded)
 *
 * @param options - IntersectionObserver options
 * @returns [ref, shouldLoad]
 */
export function useLazyLoad<T extends Element>(
  options: IntersectionObserverInit = {}
): [React.RefObject<T | null>, boolean] {
  const [ref, isIntersecting] = useIntersectionObserver<T>(options);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (isIntersecting && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [isIntersecting, shouldLoad]);

  return [ref, shouldLoad];
}

/**
 * useWindowSize - Returns current window dimensions (throttled)
 * Use for: Responsive layouts, canvas sizing
 *
 * @returns { width, height }
 */
export function useWindowSize(): { width: number; height: number } {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}

/**
 * usePrevious - Returns the previous value of a variable
 * Use for: Comparing current vs previous state, detecting changes
 *
 * @param value - The value to track
 * @returns Previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * useMediaQuery - Returns whether a media query matches
 * Use for: Responsive behavior in JS
 *
 * @param query - Media query string (e.g., '(max-width: 768px)')
 * @returns Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}

/**
 * useIsMobile - Returns whether the device is mobile-sized
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

/**
 * useIsTablet - Returns whether the device is tablet-sized
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

/**
 * usePrefersDarkMode - Returns whether the user prefers dark mode
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * usePrefersReducedMotion - Returns whether the user prefers reduced motion
 * Use for: Disabling animations for accessibility
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * useStableCallback - Returns a stable callback reference
 * Use for: Callbacks passed to memoized children
 *
 * @param callback - The callback to stabilize
 * @returns Stable callback reference
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(callback: T): T {
  const callbackRef = useRef<T>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
}

/**
 * useMemoCompare - useMemo with custom comparison
 * Use for: Complex objects that need deep comparison
 *
 * @param value - The value to memoize
 * @param compare - Comparison function
 * @returns Memoized value
 */
export function useMemoCompare<T>(
  value: T,
  compare: (prev: T | undefined, next: T) => boolean
): T {
  const previousRef = useRef<T | undefined>(undefined);
  const previous = previousRef.current;

  const isEqual = previous !== undefined && compare(previous, value);

  useEffect(() => {
    if (!isEqual) {
      previousRef.current = value;
    }
  });

  return isEqual ? previous as T : value;
}

/**
 * useOnScreen - Simple hook to check if element is on screen
 * @param ref - React ref to observe
 * @param rootMargin - Margin around root
 */
export function useOnScreen(
  ref: React.RefObject<Element>,
  rootMargin: string = '0px'
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, rootMargin]);

  return isVisible;
}

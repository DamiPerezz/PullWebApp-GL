/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals metrics for performance optimization
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';

// Performance thresholds based on Google's recommendations
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  INP: { good: 200, needsImprovement: 500 },   // Interaction to Next Paint
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
};

type MetricRating = 'good' | 'needs-improvement' | 'poor';

/**
 * Get rating for a metric value
 */
const getRating = (name: string, value: number): MetricRating => {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
};

/**
 * Report metric to analytics (extend this for your analytics provider)
 */
const reportMetric = (metric: Metric) => {
  const rating = getRating(metric.name, metric.value);

  // Only report in production to reduce noise
  if (import.meta.env.PROD) {
    // Send to analytics endpoint if configured
    const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    if (analyticsEndpoint) {
      // Use sendBeacon for reliable delivery
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating,
        id: metric.id,
        navigationType: metric.navigationType,
        url: window.location.pathname,
        timestamp: Date.now(),
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(analyticsEndpoint, body);
      }
    }
  }

  // Log in development for debugging
  if (import.meta.env.DEV) {
    const color = rating === 'good' ? 'green' : rating === 'needs-improvement' ? 'orange' : 'red';
    // eslint-disable-next-line no-console
    console.log(
      `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${rating})`,
      `color: ${color}; font-weight: bold;`
    );
  }
};

/**
 * Initialize Web Vitals tracking
 * Call this once in main.tsx
 */
export const initWebVitals = () => {
  // Core Web Vitals
  onLCP(reportMetric);  // Largest Contentful Paint
  onINP(reportMetric);  // Interaction to Next Paint (replaces FID)
  onCLS(reportMetric);  // Cumulative Layout Shift

  // Additional metrics
  onFCP(reportMetric);  // First Contentful Paint
  onTTFB(reportMetric); // Time to First Byte
};

/**
 * Performance mark utility for custom measurements
 */
export const perfMark = (name: string) => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
};

/**
 * Performance measure utility
 */
export const perfMeasure = (name: string, startMark: string, endMark?: string) => {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      const measure = performance.measure(name, startMark, endMark);
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log(`[Perf] ${name}: ${measure.duration.toFixed(2)}ms`);
      }
      return measure.duration;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Report custom performance metric
 */
export const reportCustomMetric = (name: string, value: number) => {
  if (import.meta.env.PROD) {
    const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    if (analyticsEndpoint && navigator.sendBeacon) {
      navigator.sendBeacon(analyticsEndpoint, JSON.stringify({
        name: `custom_${name}`,
        value,
        url: window.location.pathname,
        timestamp: Date.now(),
      }));
    }
  }
};

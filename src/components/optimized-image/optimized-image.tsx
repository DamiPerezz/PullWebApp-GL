/**
 * OptimizedImage Component
 * PERFORMANCE: Lazy loading, WebP support, blur placeholder, responsive
 */

import { useState, useRef, useEffect, memo } from 'react';
import './optimized-image.css';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean; // Load immediately for above-the-fold images
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
}

// Generate blur placeholder as tiny data URL
const generateBlurPlaceholder = (color = '#1a1a2e'): string => {
  return `data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'><rect fill='${encodeURIComponent(color)}' width='1' height='1'/></svg>`;
};

// Check if browser supports WebP (cached result)
let webpSupported: boolean | null = null;
const getWebPSupport = (): boolean => {
  if (webpSupported === null && typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return webpSupported ?? false;
};

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  sizes,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before entering viewport
        threshold: 0,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  // Placeholder
  const placeholderSrc = blurDataURL || generateBlurPlaceholder();

  return (
    <div
      ref={imgRef}
      className={`optimized-image ${className} ${isLoaded ? 'optimized-image--loaded' : ''}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        aspectRatio: width && height ? `${width}/${height}` : undefined,
      }}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && !isLoaded && !isError && (
        <img
          src={placeholderSrc}
          alt=""
          className="optimized-image__placeholder"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      {isInView && !isError && (
        <picture>
          {/* WebP source for browsers that support it */}
          {getWebPSupport() && src.match(/\.(jpg|jpeg|png)$/i) && (
            <source
              srcSet={src.replace(/\.(jpg|jpeg|png)$/i, '.webp')}
              type="image/webp"
            />
          )}
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            onLoad={handleLoad}
            onError={handleError}
            className={`optimized-image__img ${isLoaded ? 'optimized-image__img--visible' : ''}`}
            sizes={sizes}
          />
        </picture>
      )}

      {/* Error fallback */}
      {isError && (
        <div className="optimized-image__error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      )}
    </div>
  );
});

export default OptimizedImage;

// components/seo/seo.tsx - Componente SEO Dinámico para React 19
import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "event" | "place";
  twitterCard?: "summary" | "summary_large_image";
  noIndex?: boolean;
  structuredData?: object;
}

const BASE_URL = "https://web.pullevents.com";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const SITE_NAME = "Pull Events";

export const SEO = ({
  title,
  description = "Compra entradas para las mejores fiestas, discotecas y eventos VIP en Guatemala. Reserva mesas VIP, botellas premium y accede a los eventos más exclusivos.",
  keywords = "entradas guatemala, fiestas guatemala, discotecas guatemala, eventos vip guatemala, vida nocturna guatemala",
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_IMAGE,
  ogType = "website",
  twitterCard = "summary_large_image",
  noIndex = false,
  structuredData,
}: SEOProps) => {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} - Compra Entradas para Fiestas, Discotecas y Eventos VIP en Guatemala`;

  const finalOgTitle = ogTitle || title || fullTitle;
  const finalOgDescription = ogDescription || description;
  const finalCanonical = canonicalUrl || (typeof window !== "undefined" ? window.location.href : BASE_URL);

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper to update or create meta tag
    const setMeta = (name: string, content: string, property = false) => {
      const attribute = property ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Helper to update or create link tag
    const setLink = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
      }
      element.setAttribute("href", href);
    };

    // Primary SEO meta tags
    setMeta("description", description);
    setMeta("keywords", keywords);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");

    // Canonical URL
    setLink("canonical", finalCanonical);

    // Open Graph tags
    setMeta("og:title", finalOgTitle, true);
    setMeta("og:description", finalOgDescription, true);
    setMeta("og:image", ogImage, true);
    setMeta("og:url", finalCanonical, true);
    setMeta("og:type", ogType, true);
    setMeta("og:site_name", SITE_NAME, true);
    setMeta("og:locale", "es_GT", true);

    // Twitter Card tags
    setMeta("twitter:card", twitterCard);
    setMeta("twitter:title", finalOgTitle);
    setMeta("twitter:description", finalOgDescription);
    setMeta("twitter:image", ogImage);
    setMeta("twitter:site", "@pullevents");

    // Structured Data
    if (structuredData) {
      let scriptElement = document.querySelector('script[data-seo-structured]');
      if (!scriptElement) {
        scriptElement = document.createElement("script");
        scriptElement.setAttribute("type", "application/ld+json");
        scriptElement.setAttribute("data-seo-structured", "true");
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(structuredData);
    }

    // Cleanup function to reset to defaults on unmount
    return () => {
      // We don't reset here to avoid flicker - next page will set its own values
    };
  }, [
    fullTitle,
    description,
    keywords,
    finalCanonical,
    finalOgTitle,
    finalOgDescription,
    ogImage,
    ogType,
    twitterCard,
    noIndex,
    structuredData,
  ]);

  return null;
};

// ========================================
// STRUCTURED DATA GENERATORS
// ========================================

export const generateEventStructuredData = (event: {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
  image: string;
  url: string;
  price?: number;
  currency?: string;
  availability?: "InStock" | "SoldOut" | "PreOrder";
}) => ({
  "@context": "https://schema.org",
  "@type": "Event",
  name: event.name,
  description: event.description,
  startDate: event.startDate,
  endDate: event.endDate || event.startDate,
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: {
    "@type": "Place",
    name: event.location,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ciudad de Guatemala",
      addressCountry: "GT",
    },
  },
  image: event.image,
  url: event.url,
  organizer: {
    "@type": "Organization",
    name: "Pull Events",
    url: BASE_URL,
  },
  offers: event.price
    ? {
        "@type": "Offer",
        price: event.price,
        priceCurrency: event.currency || "GTQ",
        availability: `https://schema.org/${event.availability || "InStock"}`,
        url: event.url,
        validFrom: new Date().toISOString(),
      }
    : undefined,
});

export const generateVenueStructuredData = (venue: {
  name: string;
  description: string;
  address: string;
  image: string;
  url: string;
  rating?: number;
  reviewCount?: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "NightClub",
  name: venue.name,
  description: venue.description,
  image: venue.image,
  url: venue.url,
  address: {
    "@type": "PostalAddress",
    streetAddress: venue.address,
    addressLocality: "Ciudad de Guatemala",
    addressRegion: "Guatemala",
    addressCountry: "GT",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 14.6349,
    longitude: -90.5069,
  },
  aggregateRating: venue.rating
    ? {
        "@type": "AggregateRating",
        ratingValue: venue.rating,
        reviewCount: venue.reviewCount || 100,
        bestRating: 5,
        worstRating: 1,
      }
    : undefined,
});

export const generateBreadcrumbStructuredData = (
  items: Array<{ name: string; url: string }>
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
  })),
});

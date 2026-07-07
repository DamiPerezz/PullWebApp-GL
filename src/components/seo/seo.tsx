// components/seo/seo.tsx - Componente SEO Dinámico para React 19 con i18n
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

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
  description,
  keywords,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_IMAGE,
  ogType = "website",
  twitterCard = "summary_large_image",
  noIndex = false,
  structuredData,
}: SEOProps) => {
  const { i18n } = useTranslation('seo');
  const location = useLocation();
  const currentLang = i18n.language || 'es';

  // Default descriptions based on language
  const defaultDescription = currentLang === 'es'
    ? "Compra entradas para las mejores fiestas, discotecas y eventos VIP en Guatemala. Reserva mesas VIP, botellas premium y accede a los eventos más exclusivos."
    : "Buy tickets for the best parties, clubs and VIP events in Guatemala. Reserve VIP tables, premium bottles and access the most exclusive events.";

  const defaultKeywords = currentLang === 'es'
    ? "entradas guatemala, fiestas guatemala, discotecas guatemala, eventos vip guatemala, vida nocturna guatemala"
    : "tickets guatemala, parties guatemala, clubs guatemala, vip events guatemala, nightlife guatemala";

  const finalDescription = description || defaultDescription;
  const finalKeywords = keywords || defaultKeywords;

  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : currentLang === 'es'
      ? `${SITE_NAME} - Compra Entradas para Fiestas, Discotecas y Eventos VIP en Guatemala`
      : `${SITE_NAME} - Buy Tickets for Parties, Clubs and VIP Events in Guatemala`;

  const finalOgTitle = ogTitle || title || fullTitle;
  const finalOgDescription = ogDescription || finalDescription;

  // Build canonical URL with language prefix
  const pathWithoutLang = location.pathname.replace(/^\/(en|es)/, '');
  const finalCanonical = canonicalUrl || `${BASE_URL}/${currentLang}${pathWithoutLang}`;

  // Determine og:locale based on current language
  const ogLocale = currentLang === 'es' ? 'es_GT' : 'en_US';

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
    const setLink = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang
        ? `link[rel="${rel}"][hreflang="${hreflang}"]`
        : `link[rel="${rel}"]:not([hreflang])`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        if (hreflang) element.setAttribute("hreflang", hreflang);
        document.head.appendChild(element);
      }
      element.setAttribute("href", href);
    };

    // Primary SEO meta tags
    setMeta("description", finalDescription);
    setMeta("keywords", finalKeywords);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");

    // Language meta tag
    setMeta("language", currentLang);
    document.documentElement.lang = currentLang;

    // Canonical URL
    setLink("canonical", finalCanonical);

    // Hreflang tags for SEO
    const esUrl = `${BASE_URL}/es${pathWithoutLang}`;
    const enUrl = `${BASE_URL}/en${pathWithoutLang}`;

    setLink("alternate", esUrl, "es");
    setLink("alternate", enUrl, "en");
    setLink("alternate", esUrl, "x-default"); // Default to Spanish for Guatemala market

    // Open Graph tags
    setMeta("og:title", finalOgTitle, true);
    setMeta("og:description", finalOgDescription, true);
    setMeta("og:image", ogImage, true);
    setMeta("og:url", finalCanonical, true);
    setMeta("og:type", ogType, true);
    setMeta("og:site_name", SITE_NAME, true);
    setMeta("og:locale", ogLocale, true);
    setMeta("og:locale:alternate", currentLang === 'es' ? "en_US" : "es_GT", true);

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
    finalDescription,
    finalKeywords,
    finalCanonical,
    finalOgTitle,
    finalOgDescription,
    ogImage,
    ogType,
    ogLocale,
    twitterCard,
    noIndex,
    structuredData,
    currentLang,
    pathWithoutLang,
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

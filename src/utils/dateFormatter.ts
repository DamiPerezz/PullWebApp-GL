// Helper to get locale from URL or default
const getLocaleFromPath = (): string => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    const langMatch = path.match(/^\/(en|es)\//);
    if (langMatch) {
      return langMatch[1] === 'es' ? 'es-ES' : 'en-US';
    }
  }
  return 'es-ES'; // Default to Spanish
};

export const formatEventDate = (dateString: string, locale?: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  const currentLocale = locale || getLocaleFromPath();

  return date.toLocaleDateString(currentLocale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatEventDateShort = (dateString: string, locale?: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  const currentLocale = locale || getLocaleFromPath();

  return date.toLocaleDateString(currentLocale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatEventDateCompact = (dateString: string, locale?: string): {
  dayName: string;
  day: number;
  month: string;
  year: number;
} => {
  const date = new Date(dateString + 'T00:00:00');
  const currentLocale = locale || getLocaleFromPath();

  const dayName = date.toLocaleDateString(currentLocale, { weekday: 'short' });
  const month = date.toLocaleDateString(currentLocale, { month: 'long' });

  return {
    dayName,
    day: date.getDate(),
    month,
    year: date.getFullYear()
  };
};
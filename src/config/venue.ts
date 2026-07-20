// Slug del venue por defecto. Un único sitio; el resto del código lo importa.
// Se sobreescribe por build con VITE_DEFAULT_VENUE_SLUG. El fallback apunta al
// venue de producción actual, no a la demo vieja.
export const DEFAULT_VENUE_SLUG =
  import.meta.env.VITE_DEFAULT_VENUE_SLUG || '511-events';

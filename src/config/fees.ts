// Fee de servicio que se añade al precio de la entrada de cara al
// comprador. Acordado por venue — 511 Events: 8% (2026-07-19).
//
// ⚠️ ESTO ES SOLO DISPLAY. El importe que se COBRA lo calcula el backend
// con `venues.platform_fee_percent` (BD central) — ese es el autoritativo
// e ignora lo que envíe el cliente. Si cambias el fee, cámbialo en LOS DOS
// sitios o el recibo que ve el comprador no cuadrará con el cargo real.
// Único sitio del frontend donde se define; no hardcodear multiplicadores
// en páginas sueltas.
export const SERVICE_FEE_RATE = 0.08;
export const SERVICE_FEE_MULTIPLIER = 1 + SERVICE_FEE_RATE;

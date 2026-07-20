// Fee de servicio que se añade al precio de la entrada de cara al
// comprador. Acordado por venue — 511 Events: 8% (2026-07-19).
// ÚNICO sitio donde se define; no volver a hardcodear multiplicadores
// en páginas sueltas.
export const SERVICE_FEE_RATE = 0.08;
export const SERVICE_FEE_MULTIPLIER = 1 + SERVICE_FEE_RATE;

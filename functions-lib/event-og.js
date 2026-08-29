// =============================================================================
// Open Graph dinámico para las páginas de evento
// =============================================================================
//
// EL PROBLEMA
// -----------
// La web es una SPA: el HTML que sirve Cloudflare Pages es SIEMPRE el mismo
// index.html, con unas etiquetas Open Graph fijas (logo de Pull, título
// genérico). React rellena la página después, en el navegador.
//
// WhatsApp / Facebook / Twitter / Telegram NO ejecutan JavaScript: leen el
// HTML crudo. Por eso, al pegar el enlace de un evento, la tarjeta de
// previsualización salía siempre con el logo morado de Pull y el texto
// "The #1 App for Party Tickets" en vez del cartel del evento.
//
// LA SOLUCIÓN
// -----------
// Este middleware se ejecuta en el borde de Cloudflare SOLO en las rutas
// /es/event/* y /en/event/*. Pide el evento a la API, y reescribe al vuelo las
// etiquetas <title> / og:* / twitter:* del HTML antes de entregarlo. El
// contenido visible de la página no cambia: sigue siendo la misma SPA.
//
// REGLA DE ORO: esto NUNCA puede romper la página. Cualquier fallo (API caída,
// evento inexistente, timeout, HTML raro) devuelve el HTML original intacto.
//
// Se sirve a TODO EL MUNDO, no solo a los bots: así no hay que detectar
// user-agents (siempre se cuela alguno), Google no lo ve como "cloaking", y de
// paso mejora el SEO de las páginas de evento.
//
// Registrado en:
//   functions/es/event/_middleware.js  → /es/event/*
//   functions/en/event/_middleware.js  → /en/event/*
// (dos ficheros concretos, y no functions/[lang]/event/, a propósito: un
// segmento dinámico en la RAÍZ haría que Pages generase la ruta "/*" y todas
// las peticiones de la web —js, css, imágenes— pasarían por la Function.)
// =============================================================================

// Resolución del backend: MISMA lógica que functions/api/[[path]].js. Se
// duplica en vez de compartirse porque son dos entry points distintos y no
// merece la pena acoplarlos; si cambias una, cambia la otra.
const DEFAULT_UPSTREAM = "https://pull-api-v2-prod.fly.dev";
const PROD_HOSTS = new Set([
  "pull-511-events.pages.dev",
  "511events.pullevents.com",
  "pullevents.com",
  "www.pullevents.com",
]);

// /es/event/<slug> y cualquier subruta (…/tickets/…, …/group/setup): todas
// hablan del mismo evento, así que todas llevan la misma previsualización.
const EVENT_PATH = /^\/(es|en)\/event\/([^/]+)/;

// Si la API tarda más que esto, se sirve el HTML genérico. Vale más una
// previsualización fea que una página que no carga.
const API_TIMEOUT_MS = 2500;

// La ficha del evento se cachea en el borde: sin esto, cada visita a una
// página de evento dispararía una llamada extra a la API (el navegador ya hace
// la suya). 120 s es de sobra para una previsualización.
const API_CACHE_TTL_S = 120;

// Longitud máxima de la descripción. WhatsApp corta sobre los 160-200.
const DESC_MAX = 200;

// Dimensiones que index.html declara para el logo de Pull (1200x630). Si
// dejamos ese tamaño con el cartel del evento (normalmente vertical), Facebook
// lo recorta mal. Como no sabemos el tamaño real del cartel, se quitan y que
// lo averigüe el que lo descargue.
const DROP_TAGS = new Set(["og:image:width", "og:image:height", "og:image:type"]);

export async function handleEventOG(context) {
  const { request } = context;

  // Cualquier cosa que no sea leer una página se pasa tal cual.
  if (request.method !== "GET" && request.method !== "HEAD") {
    return context.next();
  }

  const url = new URL(request.url);
  const match = EVENT_PATH.exec(url.pathname);
  const response = await context.next();
  if (!match) return response;

  let slug;
  try {
    slug = decodeURIComponent(match[2]);
  } catch {
    slug = match[2]; // slug con %-encoding roto: se usa crudo
  }
  if (!slug) return response;

  // Solo se reescribe HTML. Si Pages devolvió otra cosa (un asset real, un
  // error), no se toca.
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.includes("text/html")) return response;

  let event;
  try {
    event = await fetchEvent(context, slug);
  } catch {
    return response; // API caída / timeout → previsualización genérica
  }
  if (!event) return response;

  try {
    const meta = buildMeta(event, url, match[1]);
    if (!meta) return response;
    return rewrite(response, meta);
  } catch {
    return response;
  }
}

// -- datos ------------------------------------------------------------------

async function fetchEvent(context, slug) {
  const { request, env } = context;
  const url = new URL(request.url);

  let upstream = env && env.UPSTREAM;
  if (!upstream) {
    // Mismo fail-safe que el proxy: un host que no es de producción y sin
    // UPSTREAM NO cae al backend de producción. Aquí simplemente no hay
    // previsualización enriquecida (no es motivo para romper la página).
    if (!PROD_HOSTS.has(url.hostname)) return null;
    upstream = DEFAULT_UPSTREAM;
  }
  upstream = String(upstream).replace(/\/+$/, "");

  const headers = new Headers({ accept: "application/json" });
  // El rate limit del backend cuenta por IP real del visitante; sin estas dos
  // cabeceras contaría la IP de salida de Cloudflare (la misma para todos) y
  // un evento con mucha gente se comería el límite. Ver functions/api/.
  const clientIP = request.headers.get("cf-connecting-ip");
  const sharedSecret = env && env.PROXY_SHARED_SECRET;
  if (clientIP && sharedSecret) {
    headers.set("X-Pull-Client-IP", clientIP);
    headers.set("X-Pull-Proxy-Auth", sharedSecret);
  }

  const apiURL =
    upstream + "/api/v1/event/get-detailed-event-info/" + encodeURIComponent(slug);

  const res = await fetch(apiURL, {
    headers,
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
    cf: { cacheTtl: API_CACHE_TTL_S, cacheEverything: true },
  });
  if (!res.ok) return null;
  return await res.json();
}

// -- construcción de las etiquetas ------------------------------------------

function buildMeta(ev, pageURL, lang) {
  const name = str(ev.name) || str(ev.event_name);
  // `image` es el cartel del evento; `event_img` es su alias legacy y
  // `cover_image` el respaldo. Si el evento no tiene cartel, no se toca nada:
  // mejor el logo de Pull que una tarjeta sin imagen.
  const image = str(ev.image) || str(ev.event_img) || str(ev.cover_image);
  if (!name || !image) return null;

  const venue = str(ev.venue_name) || (ev.venue && str(ev.venue.name)) || "";
  const place = str(ev.location) || venue;
  const when = humanDate(
    str(ev.date) || str(ev.event_date),
    str(ev.start_time) || str(ev.open_time),
    lang,
  );

  const title = place ? `${name} · ${place}` : name;

  const bits = [];
  if (when) bits.push(when);
  const detail = str(ev.short_description) || str(ev.description);
  if (detail) bits.push(detail);
  if (!bits.length) {
    bits.push(
      lang === "en"
        ? `Get your tickets${venue ? " · " + venue : ""}`
        : `Consigue tus entradas${venue ? " · " + venue : ""}`,
    );
  }
  const description = truncate(bits.join(" · "), DESC_MAX);

  // og:url debe ser la URL canónica de ESTA página. index.html trae fija la de
  // la home (web.pullevents.com), que además ni siquiera es este dominio.
  const canonical = pageURL.origin + pageURL.pathname;

  return {
    title,
    canonical,
    tags: {
      title,
      description,
      "og:type": "website",
      "og:url": canonical,
      "og:title": title,
      "og:description": description,
      "og:image": image,
      "og:image:secure_url": image,
      "og:image:alt": name,
      "og:locale": lang === "en" ? "en_US" : "es_ES",
      "twitter:card": "summary_large_image",
      "twitter:url": canonical,
      "twitter:title": title,
      "twitter:description": description,
      "twitter:image": image,
      "twitter:image:alt": name,
    },
  };
}

// La API ya devuelve `date` (YYYY-MM-DD) y `start_time` (HH:MM:SS) en la hora
// LOCAL del venue — start_datetime viene en UTC y daría un día de más para un
// evento de madrugada. Se formatea en UTC a partir de los números para que el
// servidor no meta su propio huso por medio.
function humanDate(date, time, lang) {
  if (!date) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return "";
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (Number.isNaN(d.getTime())) return "";

  let out;
  try {
    out = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  } catch {
    out = date;
  }

  const hm = /^(\d{2}):(\d{2})/.exec(time || "");
  if (hm) out += (lang === "en" ? " at " : " a las ") + hm[1] + ":" + hm[2];
  return out;
}

function truncate(s, max) {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut) + "…";
}

function str(v) {
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

// -- reescritura del HTML ---------------------------------------------------

function rewrite(response, meta) {
  return new HTMLRewriter()
    .on("title", {
      element(el) {
        el.setInnerContent(meta.title);
      },
    })
    .on("meta", {
      element(el) {
        const key = el.getAttribute("property") || el.getAttribute("name");
        if (!key) return;
        if (DROP_TAGS.has(key)) {
          el.remove();
          return;
        }
        const value = meta.tags[key];
        if (value !== undefined) el.setAttribute("content", value);
      },
    })
    .on('link[rel="canonical"]', {
      element(el) {
        el.setAttribute("href", meta.canonical);
      },
    })
    .transform(response);
}

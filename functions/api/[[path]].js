// Cloudflare Pages Function — transparent proxy from the WebApp's own
// origin (aurora-hall.pages.dev) to the Fly.io API.
//
// Why: some client DNS resolvers (corporate VPN, WireGuard tunnels) fail to
// resolve *.fly.dev. Pages already serves under pages.dev — by proxying API
// requests through the same domain we avoid the failing DNS lookup and
// sidestep CORS entirely (same-origin requests).
//
// The catch-all `[[path]]` segment captures everything after /api/, so
// /api/v1/venues -> <UPSTREAM>/api/v1/venues, etc.

// Each Pages project sets its own UPSTREAM env var (Cloudflare Pages →
// Settings → Environment variables). This fallback is the 511 Events
// production backend; a project that forgets UPSTREAM still reaches a real
// backend rather than the old demo.
const DEFAULT_UPSTREAM = "https://pull-api-v2-prod.fly.dev";

// CORS del PROXY: la web real es same-origin (no lo necesita), pero la app
// móvil en modo web (expo web, localhost) y cualquier build nativa que pase
// por aquí sí hacen peticiones cross-origin con Authorization → preflight.
// El backend no puede reflejar el Origin porque se lo quitamos a propósito,
// así que el CORS lo respondemos aquí. SIN allow-credentials: los flujos con
// cookie (wallet) son same-origin y así el navegador nunca manda cookies
// cross-site.
function corsHeaders(request) {
  const origin = request.headers.get("origin");
  if (!origin) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "access-control-allow-headers": "Content-Type, Authorization, X-Requested-With, X-Request-ID",
    "access-control-max-age": "86400",
    "vary": "Origin",
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Preflight: contestar aquí, sin molestar al backend.
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const upstream = (env && env.UPSTREAM) || DEFAULT_UPSTREAM;

  // Rebuild the upstream URL preserving the full path + query.
  const upstreamURL = upstream + url.pathname + url.search;

  // IP real del comprador (Cloudflare la pone auténtica en su edge). Se
  // reenvía al backend con un secreto compartido para que el rate limit use
  // la IP del COMPRADOR, no la de salida de Cloudflare (que es la misma para
  // todos → colapsaría los límites y daría 429 masivo al abrir la venta).
  const realClientIP = request.headers.get("cf-connecting-ip");

  // Forward method, headers, body. Strip CF-injected headers.
  const headers = new Headers(request.headers);
  // Strip client-controlled forwarding headers so the backend derives the
  // real IP from Fly-Client-IP, not a spoofable X-Forwarded-For (audit A2).
  // Also drop the browser's Origin: this is a same-origin server-side fetch,
  // so the backend's CORS allowlist should not gate it (otherwise it 403s
  // "Origin not allowed" on the purchase POST).
  ["host", "cf-connecting-ip", "cf-ipcountry", "cf-ray", "cf-visitor",
   "x-forwarded-proto", "x-real-ip", "x-forwarded-for", "origin",
   "x-pull-client-ip", "x-pull-proxy-auth"].forEach((h) => headers.delete(h));

  // Reenviar la IP real del comprador + el secreto que prueba que venimos de
  // este proxy (el backend solo confía en X-Pull-Client-IP con el secreto
  // correcto; un ataque directo a fly.dev no lo conoce).
  if (realClientIP && env && env.PROXY_SHARED_SECRET) {
    headers.set("X-Pull-Client-IP", realClientIP);
    headers.set("X-Pull-Proxy-Auth", env.PROXY_SHARED_SECRET);
  }

  const init = {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "manual",
  };

  let response;
  try {
    response = await fetch(upstreamURL, init);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "proxy_upstream_failure", message: String(err) }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }

  // Stream the response back. Since this is same-origin to the WebApp, no
  // CORS headers are needed — but we strip hop-by-hop headers that confuse
  // the edge.
  const respHeaders = new Headers(response.headers);
  ["transfer-encoding", "connection"].forEach((h) => respHeaders.delete(h));
  for (const [k, v] of Object.entries(corsHeaders(request))) {
    respHeaders.set(k, v);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: respHeaders,
  });
}

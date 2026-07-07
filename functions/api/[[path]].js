// Cloudflare Pages Function — transparent proxy from the WebApp's own
// origin (aurora-hall.pages.dev) to the Fly.io API.
//
// Why: some client DNS resolvers (corporate VPN, WireGuard tunnels) fail to
// resolve *.fly.dev. Pages already serves under pages.dev — by proxying API
// requests through the same domain we avoid the failing DNS lookup and
// sidestep CORS entirely (same-origin requests).
//
// The catch-all `[[path]]` segment captures everything after /api/, so
// /api/v1/venues -> https://pull-api-v2-demo.fly.dev/api/v1/venues, etc.

const UPSTREAM = "https://pull-api-v2-demo.fly.dev";

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Rebuild the upstream URL preserving the full path + query.
  const upstreamURL = UPSTREAM + url.pathname + url.search;

  // Forward method, headers, body. Strip CF-injected headers.
  const headers = new Headers(request.headers);
  ["host", "cf-connecting-ip", "cf-ipcountry", "cf-ray", "cf-visitor",
   "x-forwarded-proto", "x-real-ip"].forEach((h) => headers.delete(h));

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

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: respHeaders,
  });
}

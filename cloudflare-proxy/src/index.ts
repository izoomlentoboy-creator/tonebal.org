/**
 * Cloudflare Worker — reverse proxy to Vercel origin.
 *
 * Solves the problem of Vercel being blocked in Russia:
 * Russian users connect to Cloudflare's edge network (not blocked),
 * and the Worker fetches content from Vercel on their behalf.
 */

export interface Env {
  VERCEL_ORIGIN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Redirect www -> apex domain
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.replace("www.", "");
      return Response.redirect(url.toString(), 301);
    }

    // Build the origin URL pointing to Vercel
    const originUrl = new URL(url.pathname + url.search, env.VERCEL_ORIGIN);

    // Forward the request to Vercel
    const originRequest = new Request(originUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      redirect: "manual",
    });

    // Set the Host header to the Vercel origin so Vercel routes correctly
    originRequest.headers.set("Host", new URL(env.VERCEL_ORIGIN).hostname);
    // Forward real client IP
    originRequest.headers.set("X-Forwarded-For", request.headers.get("CF-Connecting-IP") || "");
    originRequest.headers.set("X-Forwarded-Proto", "https");
    // Pass the original host for apps that need it
    originRequest.headers.set("X-Forwarded-Host", url.hostname);

    try {
      const response = await fetch(originRequest);

      // Clone response headers so we can modify them
      const responseHeaders = new Headers(response.headers);

      // Remove Vercel-specific headers that might leak origin info
      responseHeaders.delete("x-vercel-id");
      responseHeaders.delete("x-vercel-cache");
      responseHeaders.delete("server");

      // Handle redirects from Vercel: rewrite origin URLs back to our domain
      const location = responseHeaders.get("location");
      if (location) {
        const redirectUrl = new URL(location, env.VERCEL_ORIGIN);
        if (redirectUrl.hostname === new URL(env.VERCEL_ORIGIN).hostname) {
          redirectUrl.hostname = url.hostname;
          redirectUrl.protocol = "https:";
          responseHeaders.set("location", redirectUrl.toString());
        }
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response("Origin unavailable", { status: 502 });
    }
  },
};

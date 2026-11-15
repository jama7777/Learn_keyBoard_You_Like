import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Every response that leaves this app goes through here. The headers below are
 * the cheap, high-value half of browser-side defence: they stop MIME sniffing,
 * clickjacking, referrer leakage and unwanted feature access. They do not
 * replace the route-level checks — they are defence in depth.
 *
 * `next.config.ts` sets `poweredByHeader: false` for the `X-Powered-By` header,
 * which middleware cannot touch.
 */

/**
 * Next.js hydrates by injecting inline `<script>` tags, so a strict
 * `'self'`-only script-src would blank the app. A per-request nonce is used
 * instead: the browser will only run an inline script whose nonce matches the
 * one in the CSP header, so an injected inline script cannot execute.
 *
 * `unsafe-inline` is kept only for style-src (Next.js/Tailwind inline styles);
 * script-src is nonce-only.
 */
function contentSecurityPolicy(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // The background-audio player uses an object URL created from an uploaded
    // File, so blob: has to be allowed for media. Without an explicit
    // media-src this falls back to default-src 'self' and the audio is blocked.
    "media-src 'self' blob:",
    // Every fetch the client makes is to our own API. The base64 upload is
    // posted as a request body, never fetched back as a data: URL, so no
    // external origin needs to be listed here.
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-DNS-Prefetch-Control': 'off',
};

export function middleware(request: NextRequest) {
  // Per-request nonce for the CSP script-src. Forwarded to the server layout
  // through the request headers so `headers()` in the root layout can read it
  // and apply it to <html nonce={...}>.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = contentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set('Content-Security-Policy', cspHeader);

  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(header, value);
  }

  // HSTS only over HTTPS — sending it on plain HTTP is ignored by browsers and
  // misleading in the headers, so it is conditional.
  if (request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    );
  }

  return response;
}

export const config = {
  /*
   * Apply to everything except Next's own internals and static assets.
   * `_next/static` and `favicon.ico` are exempt so the matcher does not run on
   * every chunk; the headers are still set on the HTML responses that matter.
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

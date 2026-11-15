/**
 * CSRF defence-in-depth for state-changing API routes.
 *
 * The session cookie is `SameSite=Lax`, so a cross-site POST never carries it and
 * the server returns 401 before any work. This is a second line of defence for the
 * routes that cost money or mutate data: if a browser *does* send an Origin header
 * (most do for POST), it must match our own origin. A missing Origin header — older
 * browsers or same-origin navigations — is allowed, relying on SameSite as the
 * backstop, so legitimate same-origin requests are never rejected.
 *
 * Two independent conditions must both hold for an Origin to be accepted:
 *
 *  1. The Origin host must equal the host this request was addressed to. The
 *     browser sets `host` to the origin it is connecting to and page JavaScript
 *     cannot override it, so a browser-driven cross-site request can never make
 *     the two agree.
 *
 *  2. That request host must itself be a host we deploy on — a Vercel preview or
 *     production hostname, or an explicitly configured origin. Without this
 *     second condition, a non-browser client could send a spoofed `host` and
 *     `origin` pair and walk straight past condition 1. Restricting the set of
 *     hosts we answer for keeps that door shut while still allowing every
 *     Vercel preview deployment, whose hostname changes on each push.
 */

/** Extra origins to trust beyond the request's own host, e.g. a separate API domain. */
const EXTRA_TRUSTED_ORIGINS = (process.env.TRUSTED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/** Local dev servers, trusted so the app is usable before Vercel is wired up. */
const DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

/** Hostname suffixes of the platform we deploy on. Previews get unique subdomains. */
const TRUSTED_HOST_SUFFIXES = ['.vercel.app'];

/** Bare hostnames that are always ours, with or without a subdomain. */
const TRUSTED_HOST_EXACT = new Set(['vercel.app']);

function hostOf(origin: string): string | null {
  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * The hosts we answer for: the production/preview domains plus anything the
 * operator configured explicitly.
 */
function trustedDeploymentHosts(): Set<string> {
  const hosts = new Set<string>(TRUSTED_HOST_EXACT);
  for (const origin of [process.env.NEXT_PUBLIC_SITE_URL ?? '', ...EXTRA_TRUSTED_ORIGINS]) {
    const host = hostOf(origin);
    if (host) hosts.add(host);
  }
  return hosts;
}

/**
 * True when this host is one we actually serve the app on.
 */
function isTrustedDeploymentHost(host: string): boolean {
  if (host.startsWith('localhost') || host === '127.0.0.1' || host.endsWith('.localhost')) {
    return true;
  }
  if (trustedDeploymentHosts().has(host)) return true;
  return TRUSTED_HOST_SUFFIXES.some(
    (suffix) => host.endsWith(suffix) || host === suffix.replace(/^\./, ''),
  );
}

/**
 * The host this request was addressed to.
 *
 * `host` is used, not `x-forwarded-host`: the browser sets `host` to the origin it
 * is connecting to and page JavaScript cannot override it, so it is the value an
 * attacker cannot forge from a web page. `x-forwarded-host` is only a fallback for
 * the case where a proxy strips `host`, and a client can set that header itself,
 * so it is never the primary source of truth.
 */
function requestHosts(request: Request): string[] {
  const hosts: string[] = [];

  const host = request.headers.get('host');
  if (host) hosts.push(host.trim().toLowerCase());

  if (hosts.length === 0) {
    const forwarded = request.headers.get('x-forwarded-host');
    if (forwarded) {
      const first = forwarded.split(',')[0].trim().toLowerCase();
      if (first) hosts.push(first);
    }
  }

  return hosts;
}

/**
 * True when the request is same-origin (or Origin is absent, so SameSite covers it).
 * A malformed Origin is rejected outright.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  const originHost = hostOf(origin);
  if (!originHost) return false;

  for (const trusted of DEV_ORIGINS) {
    if (hostOf(trusted) === originHost) return true;
  }

  for (const trusted of EXTRA_TRUSTED_ORIGINS) {
    if (hostOf(trusted) === originHost) return true;
  }

  // The request must have been addressed to a host we deploy on, and the Origin
  // must name that same host. Both conditions, or the request is cross-origin.
  for (const requestHost of requestHosts(request)) {
    if (!isTrustedDeploymentHost(requestHost)) continue;
    if (requestHost === originHost) return true;
  }

  return false;
}

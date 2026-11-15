'use client';

import { signIn } from 'next-auth/react';

type Provider = { id: string; name: string };

/**
 * Provider buttons.
 *
 * Auth.js v5 does NOT support `GET /api/auth/signin/:providerId` — its built-in
 * signin page throws `UnknownAction("Unsupported action")` when a providerId
 * arrives in the URL path. The provider must be sent in the POST body to
 * `/api/auth/signin`, which is exactly what `signIn(id)` from next-auth/react
 * does (it sets `redirect: false` here so the OAuth round-trip is not blocked by
 * an intermediate page navigation).
 */
export default function SignInButtons({ providers }: { providers: Provider[] }) {
  if (providers.length === 0) {
    return (
      <p className="text-sm text-amber-400">
        No auth providers configured. Set AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
        and/or AUTH_GITHUB_ID / AUTH_GITHUB_SECRET in the environment.
      </p>
    );
  }

  return (
    <>
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() => signIn(provider.id, { callbackUrl: '/' })}
          className="block w-full rounded-lg bg-slate-800 px-4 py-3 text-center text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
        >
          Sign in with {provider.name}
        </button>
      ))}
    </>
  );
}

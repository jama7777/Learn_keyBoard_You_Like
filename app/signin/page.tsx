import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import SignInButtons from './SignInButtons';

export const runtime = 'nodejs';

/**
 * Sign-in page.
 *
 * Provider buttons are derived from which credentials are present in the
 * environment rather than from `getProviders()` — that function lives in
 * `next-auth/react` and can only run in a client component. Reading the env
 * vars here keeps this a server component with no extra round-trip, and
 * matches how Auth.js v5 infers providers from `AUTH_*` variables.
 */
export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect('/');

  const providers: Array<{ id: string; name: string }> = [];

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push({ id: 'google', name: 'Google' });
  }
  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push({ id: 'github', name: 'GitHub' });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-50">Sign in to TypeMaster AI</h1>
        <p className="mt-2 text-sm text-slate-400">
          Your lesson history and WPM stats are saved to your account.
        </p>

        <div className="mt-6 space-y-3">
          <SignInButtons providers={providers} />
        </div>

        <p className="mt-6 text-xs text-slate-500">
          You can keep practising without an account; your history stays in this browser only.
        </p>
      </div>
    </main>
  );
}

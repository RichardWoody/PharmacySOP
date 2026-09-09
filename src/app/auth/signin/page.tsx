'use client';

import { useState, useEffect, Suspense } from 'react';
import { getProviders, signIn, type ClientSafeProvider } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

function SignInInner() {
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null);
  const [email, setEmail] = useState('');
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <div className="rounded-lg border border-nhs-paleblue bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-nhs-darkblue">Staff Sign In</h1>
        <p className="mb-6 text-sm text-nhs-midgrey">
          Belfield Pharmacy SOP Portal (ODS: FHR07)
        </p>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            Sign in failed. Please check your details and try again.
          </div>
        )}

        {providers?.['azure-ad'] && (
          <button
            onClick={() => signIn('azure-ad', { callbackUrl })}
            className="mb-4 w-full rounded bg-nhs-blue px-4 py-2 font-medium text-white transition hover:bg-nhs-darkblue"
          >
            Sign in with Microsoft
          </button>
        )}

        {providers?.demo && (
          <div className="mt-2 border-t border-nhs-paleblue pt-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-nhs-midgrey">
              Demo / Local Sign-In
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                signIn('demo', { email, callbackUrl });
              }}
              className="flex flex-col gap-2"
            >
              <input
                type="email"
                required
                placeholder="staff@belfieldpharmacy.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded border border-nhs-midgrey/40 px-3 py-2 text-sm focus:border-nhs-blue focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded border border-nhs-blue px-4 py-2 font-medium text-nhs-blue transition hover:bg-nhs-paleblue"
              >
                Continue with staff email
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}

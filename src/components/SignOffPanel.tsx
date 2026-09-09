'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';

function formatDateTime(value: string | Date) {
  const d = new Date(value);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SignOffPanel({
  sopId,
  isAuthenticated,
  initiallySigned,
  signedAt,
}: {
  sopId: string;
  isAuthenticated: boolean;
  initiallySigned: boolean;
  signedAt: string | null;
}) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState(initiallySigned);
  const [signedTimestamp, setSignedTimestamp] = useState<string | null>(signedAt);

  async function handleSign() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sops/${encodeURIComponent(sopId)}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ declarationAccepted: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to sign SOP');
      }
      setSigned(true);
      setSignedTimestamp(data.signedAt ?? new Date().toISOString());
      setRedirecting(true);
	setTimeout(() => {
  	router.push('/');
  	router.refresh();
	}, 1200);
	catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (signed) {
    return (
      <div className="card border-nhs-green/40 bg-green-50 p-5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 shrink-0 text-nhs-green" />
          <div>
            <p className="font-semibold text-green-900">
  		{redirecting ? 'Signed successfully! Returning to dashboard...' : 'You have signed this SOP'}
		</p>
            {signedTimestamp && (
              <p className="text-sm text-green-800">Signed on {formatDateTime(signedTimestamp)}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="card border-amber-300 bg-amber-50 p-5">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 shrink-0 text-amber-700" />
          <p className="text-sm text-amber-900">
            Please sign in with your staff account to digitally sign this SOP.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="mb-3 font-semibold text-nhs-darkblue">Digital Sign-Off</h3>
      <label className="mb-4 flex cursor-pointer items-start gap-3 text-sm text-nhs-darkgrey">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-nhs-midgrey text-nhs-green focus:ring-nhs-green"
        />
        <span>
          I confirm I have read, understood, and agree to adhere to this SOP.
        </span>
      </label>

      {error && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleSign}
        disabled={!accepted || submitting}
        className="btn-success w-full sm:w-auto"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Sign &amp; Confirm
      </button>
    </div>
  );
}

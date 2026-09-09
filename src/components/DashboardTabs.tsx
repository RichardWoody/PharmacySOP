'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, Clock } from 'lucide-react';

export interface PendingSopRow {
  sop_id: string;
  sop_title: string;
  category_name: string;
  version_number: string;
  effective_from: string;
}

export interface CompletedSopRow {
  sop_id: string;
  title: string;
  category_name: string;
  version_number: string;
  signed_at: string;
}

function formatDate(value: string | Date | null) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function DashboardTabs({
  pending,
  completed,
}: {
  pending: PendingSopRow[];
  completed: CompletedSopRow[];
}) {
  const [tab, setTab] = useState<'pending' | 'completed'>(pending.length > 0 ? 'pending' : 'completed');

  const groupedPending = pending.reduce<Record<string, PendingSopRow[]>>((acc, row) => {
    (acc[row.category_name] ??= []).push(row);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-4 flex gap-2 border-b border-nhs-paleblue">
        <button
          onClick={() => setTab('pending')}
          className={`relative -mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === 'pending'
              ? 'border-nhs-blue text-nhs-blue'
              : 'border-transparent text-nhs-midgrey hover:text-nhs-darkgrey'
          }`}
        >
          <Clock className="h-4 w-4" />
          Pending Signature (Action Required)
          {pending.length > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`relative -mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === 'completed'
              ? 'border-nhs-blue text-nhs-blue'
              : 'border-transparent text-nhs-midgrey hover:text-nhs-darkgrey'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Completed / Signed
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
            {completed.length}
          </span>
        </button>
      </div>

      {tab === 'pending' && (
        <div>
          {pending.length === 0 ? (
            <div className="card p-8 text-center text-nhs-midgrey">
              <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-nhs-green" />
              <p className="font-medium text-nhs-darkgrey">
                All caught up! No outstanding SOPs to sign.
              </p>
            </div>
          ) : (
            Object.entries(groupedPending).map(([category, rows]) => (
              <div key={category} className="mb-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-nhs-midgrey">
                  {category}
                </h3>
                <div className="card divide-y divide-nhs-paleblue">
                  {rows.map((row) => (
                    <div
                      key={row.sop_id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-yellow">{row.sop_id}</span>
                          <span className="badge bg-nhs-paleblue text-nhs-darkblue">
                            {row.category_name}
                          </span>
                        </div>
                        <p className="mt-1.5 font-semibold text-nhs-darkgrey">{row.sop_title}</p>
                        <p className="mt-0.5 text-xs text-nhs-midgrey">
                          Version {row.version_number} &middot; Effective{' '}
                          {formatDate(row.effective_from)}
                        </p>
                      </div>
                      <Link
                        href={`/sops/${encodeURIComponent(row.sop_id)}`}
                        className="btn-success shrink-0"
                      >
                        Review &amp; Sign
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'completed' && (
        <div className="card divide-y divide-nhs-paleblue">
          {completed.length === 0 ? (
            <p className="p-8 text-center text-nhs-midgrey">No SOPs signed yet.</p>
          ) : (
            completed.map((row) => (
              <div
                key={row.sop_id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-green">{row.sop_id}</span>
                    <span className="badge bg-nhs-paleblue text-nhs-darkblue">
                      {row.category_name}
                    </span>
                  </div>
                  <p className="mt-1.5 font-semibold text-nhs-darkgrey">{row.title}</p>
                  <p className="mt-0.5 text-xs text-nhs-midgrey">
                    Version {row.version_number} &middot; Signed {formatDate(row.signed_at)}
                  </p>
                </div>
                <Link
                  href={`/sops/${encodeURIComponent(row.sop_id)}`}
                  className="btn-outline shrink-0"
                >
                  View SOP
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

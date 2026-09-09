import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import SopMarkdown from '@/components/SopMarkdown';
import SignOffPanel from '@/components/SignOffPanel';
import { FileText } from 'lucide-react';

interface ActiveSopRow {
  sop_id: string;
  category_id: string;
  category_name: string;
  title: string;
  active_version_id: string;
  version_number: string;
  effective_from: string;
  review_due_date: string;
  approved_by_name: string | null;
  approved_by_gphc: string | null;
}

function formatDate(value: string | Date | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

async function getActiveSop(sopId: string): Promise<ActiveSopRow | null> {
  const result = await pool.query<ActiveSopRow>(
    `SELECT * FROM v_active_sops WHERE sop_id = $1 LIMIT 1`,
    [sopId]
  );
  return result.rows[0] ?? null;
}

async function getContentMarkdown(versionId: string): Promise<string> {
  const result = await pool.query<{ content_markdown: string }>(
    `SELECT content_markdown FROM sop_versions WHERE id = $1`,
    [versionId]
  );
  return result.rows[0]?.content_markdown ?? '';
}

async function getSignature(versionId: string, staffId: string) {
  const result = await pool.query<{ signed_at: string }>(
    `SELECT signed_at FROM staff_signatures WHERE sop_version_id = $1 AND staff_user_id = $2 LIMIT 1`,
    [versionId, staffId]
  );
  return result.rows[0] ?? null;
}

export default async function SopReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sopId = decodeURIComponent(id);
  const sop = await getActiveSop(sopId);

  if (!sop) {
    notFound();
  }

  const [content, session] = await Promise.all([
    getContentMarkdown(sop.active_version_id),
    getServerSession(authOptions),
  ]);

  const signature = session?.user?.staffId
    ? await getSignature(sop.active_version_id, session.user.staffId)
    : null;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="card mb-6 overflow-hidden">
        <div className="bg-nhs-darkblue px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span className="badge bg-white/15 text-white">{sop.sop_id}</span>
            <span className="badge bg-white/15 text-white">{sop.category_name}</span>
          </div>
          <h1 className="mt-2 text-xl font-bold">{sop.title}</h1>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-6 py-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-nhs-midgrey">Pharmacy (ODS)</p>
            <p className="font-semibold text-nhs-darkgrey">
              {process.env.NEXT_PUBLIC_PHARMACY_NAME ?? 'Belfield Pharmacy'} &middot;{' '}
              {process.env.NEXT_PUBLIC_ODS_CODE ?? 'FHR07'}
            </p>
          </div>
          <div>
            <p className="text-nhs-midgrey">Superintendent</p>
            <p className="font-semibold text-nhs-darkgrey">
              {sop.approved_by_name ?? 'Anjam Rashid'}
              {sop.approved_by_gphc ? ` (GPhC ${sop.approved_by_gphc})` : ''}
            </p>
          </div>
          <div>
            <p className="text-nhs-midgrey">Version</p>
            <p className="font-semibold text-nhs-darkgrey">{sop.version_number}</p>
          </div>
          <div>
            <p className="text-nhs-midgrey">Effective Date</p>
            <p className="font-semibold text-nhs-darkgrey">{formatDate(sop.effective_from)}</p>
          </div>
          <div>
            <p className="text-nhs-midgrey">Review Due</p>
            <p className="font-semibold text-nhs-darkgrey">{formatDate(sop.review_due_date)}</p>
          </div>
        </div>
      </div>

      <div className="card mb-6 p-6">
        <SopMarkdown content={content} />
      </div>

      <SignOffPanel
        sopId={sop.sop_id}
        isAuthenticated={Boolean(session?.user?.staffId)}
        initiallySigned={Boolean(signature)}
        signedAt={signature?.signed_at ?? null}
      />
    </div>
  );
}

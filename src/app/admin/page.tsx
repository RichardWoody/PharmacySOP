import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import SopLibrary, { type LibrarySopRow } from '@/components/SopLibrary';
import { CalendarClock, ShieldAlert, ShieldCheck, Table2 } from 'lucide-react';

const MASTER_REVIEW_DATE = new Date('2028-09-01T00:00:00Z');

async function getTotalSops(): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT count(*) FROM sops WHERE is_active = true`
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function getOverallCompliance(): Promise<number> {
  const result = await pool.query<{ signed: string; applicable: string }>(
    `SELECT
        count(*) FILTER (WHERE compliance_status = 'SIGNED') AS signed,
        count(*) FILTER (WHERE compliance_status IN ('SIGNED', 'PENDING')) AS applicable
       FROM v_training_matrix`
  );
  const signed = Number(result.rows[0]?.signed ?? 0);
  const applicable = Number(result.rows[0]?.applicable ?? 0);
  return applicable === 0 ? 100 : Math.round((signed / applicable) * 100);
}

async function getSopLibrary(): Promise<LibrarySopRow[]> {
  const result = await pool.query<LibrarySopRow>(
    `SELECT sop_id, category_id, category_name, title, version_number, effective_from, review_due_date
       FROM v_active_sops
      ORDER BY category_name, sop_id`
  );
  return result.rows;
}

function AccessDenied() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-amber-600" />
      <h1 className="mb-2 text-xl font-bold text-nhs-darkblue">Pharmacist Access Only</h1>
      <p className="text-nhs-midgrey">
        The Admin Dashboard is restricted to pharmacist staff members. Please contact the
        Superintendent Pharmacist if you believe this is incorrect.
      </p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isPharmacist) {
    return <AccessDenied />;
  }

  const [totalSops, compliance, sops] = await Promise.all([
    getTotalSops(),
    getOverallCompliance(),
    getSopLibrary(),
  ]);

  const now = new Date();
  const daysUntilReview = Math.ceil(
    (MASTER_REVIEW_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-nhs-darkblue">Pharmacist Admin Dashboard</h1>
        <Link href="/admin/matrix" className="btn-outline">
          <Table2 className="h-4 w-4" />
          GPhC Training Matrix
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm font-medium text-nhs-midgrey">Total SOPs</p>
          <p className="mt-2 text-3xl font-bold text-nhs-darkblue">{totalSops}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-nhs-midgrey">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-sm font-medium">Overall Staff Compliance</p>
          </div>
          <p
            className={`mt-2 text-3xl font-bold ${
              compliance >= 90 ? 'text-nhs-green' : compliance >= 70 ? 'text-amber-600' : 'text-red-600'
            }`}
          >
            {compliance}%
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-nhs-midgrey">
            <CalendarClock className="h-4 w-4" />
            <p className="text-sm font-medium">Master 2-Year Review Date</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-nhs-darkblue">01/09/2028</p>
          <p className="mt-1 text-xs text-nhs-midgrey">
            {daysUntilReview > 0 ? `${daysUntilReview} days remaining` : 'Review due'}
          </p>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-bold text-nhs-darkblue">SOP Library</h2>
      <SopLibrary sops={sops} />
    </div>
  );
}

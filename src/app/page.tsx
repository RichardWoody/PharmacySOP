import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import DashboardTabs, { type CompletedSopRow, type PendingSopRow } from '@/components/DashboardTabs';
import { ClipboardList, LogIn, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

async function getPendingSops(staffId: string): Promise<PendingSopRow[]> {
  const result = await pool.query<PendingSopRow>(
    `SELECT sop_id, sop_title, category_name, version_number, effective_from
       FROM v_outstanding_signatures
      WHERE staff_id = $1
      ORDER BY category_name, sop_id`,
    [staffId]
  );
  return result.rows;
}

async function getCompletedSops(staffId: string): Promise<CompletedSopRow[]> {
  const result = await pool.query<CompletedSopRow>(
    `SELECT s.id AS sop_id,
            s.title,
            c.name AS category_name,
            v.version_number,
            sig.signed_at
       FROM staff_signatures sig
       JOIN sop_versions v ON v.id = sig.sop_version_id AND v.status = 'active'
       JOIN sops s ON s.id = v.sop_id
       JOIN sop_categories c ON c.id = s.category_id
      WHERE sig.staff_user_id = $1
      ORDER BY sig.signed_at DESC`,
    [staffId]
  );
  return result.rows;
}

function SignedOutState() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-nhs-blue" />
      <h1 className="mb-2 text-xl font-bold text-nhs-darkblue">Belfield Pharmacy SOP Portal</h1>
      <p className="mb-6 text-nhs-midgrey">
        Sign in with your staff account to review and sign off Standard Operating Procedures.
      </p>
      <Link href="/auth/signin" className="btn-primary mx-auto w-fit">
        <LogIn className="h-4 w-4" />
        Sign In
      </Link>
    </div>
  );
}

export default async function StaffDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.staffId) {
    return <SignedOutState />;
  }

  const staffId = session.user.staffId;
  const [pending, completed] = await Promise.all([
    getPendingSops(staffId),
    getCompletedSops(staffId),
  ]);

  const totalAssigned = pending.length + completed.length;
  const percentComplete = totalAssigned === 0 ? 100 : Math.round((completed.length / totalAssigned) * 100);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-nhs-darkblue">
            Welcome back, {session.user.fullName ?? session.user.name}
          </h1>
          <span className="badge mt-1 bg-nhs-paleblue text-nhs-darkblue">
            {session.user.roleName ?? 'Staff'}
          </span>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-nhs-midgrey">
            <ClipboardList className="h-4 w-4" />
            <p className="text-sm font-medium">Total Assigned</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-nhs-darkblue">{totalAssigned}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-nhs-midgrey">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-sm font-medium">Completed</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-nhs-green">{completed.length}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-nhs-midgrey">
            <ClipboardList className="h-4 w-4" />
            <p className="text-sm font-medium">Pending Signature</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-600">{pending.length}</p>
        </div>
      </div>

      <div className="card mb-8 p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-nhs-darkgrey">Compliance Progress</p>
          <p className="text-sm font-bold text-nhs-blue">{percentComplete}%</p>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-nhs-paleblue">
          <div
            className="h-full rounded-full bg-nhs-green transition-all"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      <DashboardTabs pending={pending} completed={completed} />
    </div>
  );
}

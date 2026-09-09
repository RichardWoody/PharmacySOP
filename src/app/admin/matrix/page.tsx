import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import TrainingMatrixGrid, { type MatrixRow } from '@/components/TrainingMatrixGrid';
import { ShieldAlert, Table2 } from 'lucide-react';

async function getMatrixRows(): Promise<MatrixRow[]> {
  const result = await pool.query<MatrixRow>(
    `SELECT sop_id, sop_title, version_number, staff_name, staff_role, compliance_status, signed_at
       FROM v_training_matrix
      ORDER BY sop_id, staff_name`
  );
  return result.rows;
}

function AccessDenied() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-amber-600" />
      <h1 className="mb-2 text-xl font-bold text-nhs-darkblue">Pharmacist Access Only</h1>
      <p className="text-nhs-midgrey">
        The GPhC Training Matrix is restricted to pharmacist staff members.
      </p>
    </div>
  );
}

export default async function TrainingMatrixPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isPharmacist) {
    return <AccessDenied />;
  }

  const rows = await getMatrixRows();

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Table2 className="h-6 w-6 text-nhs-blue" />
        <div>
          <h1 className="text-2xl font-bold text-nhs-darkblue">GPhC Compliance &amp; Training Matrix</h1>
          <p className="text-sm text-nhs-midgrey">
            Full record of staff sign-off against every active SOP, for GPhC inspection audits.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 text-xs text-nhs-midgrey">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-green-100 ring-1 ring-green-400" /> Signed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-100 ring-1 ring-amber-400" /> Pending
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-gray-200 ring-1 ring-gray-400" /> N/A (Not Required for Role)
        </span>
      </div>

      <TrainingMatrixGrid rows={rows} />
    </div>
  );
}

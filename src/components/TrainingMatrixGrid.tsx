'use client';

import { useMemo } from 'react';
import { Download } from 'lucide-react';

export interface MatrixRow {
  sop_id: string;
  sop_title: string;
  version_number: string;
  staff_name: string;
  staff_role: string;
  compliance_status: 'SIGNED' | 'PENDING' | 'NOT_REQUIRED';
  signed_at: string | null;
}

function formatDate(value: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function StatusCell({ status, signedAt }: { status: MatrixRow['compliance_status']; signedAt: string | null }) {
  if (status === 'SIGNED') {
    return (
      <div className="flex flex-col items-center rounded bg-green-100 px-2 py-1.5 text-green-800">
        <span className="text-xs font-bold">SIGNED</span>
        <span className="text-[10px]">{formatDate(signedAt)}</span>
      </div>
    );
  }
  if (status === 'PENDING') {
    return (
      <div className="rounded bg-amber-100 px-2 py-1.5 text-center text-xs font-bold text-amber-800">
        PENDING
      </div>
    );
  }
  return (
    <div className="rounded bg-gray-200 px-2 py-1.5 text-center text-xs font-semibold text-gray-500">
      N/A
    </div>
  );
}

function downloadCsv(rows: MatrixRow[], staffNames: string[]) {
  const sopMap = new Map<string, { title: string; version: string; cells: Map<string, MatrixRow> }>();
  rows.forEach((r) => {
    if (!sopMap.has(r.sop_id)) {
      sopMap.set(r.sop_id, { title: r.sop_title, version: r.version_number, cells: new Map() });
    }
    sopMap.get(r.sop_id)!.cells.set(r.staff_name, r);
  });

  const header = ['SOP ID', 'SOP Title', 'Version', ...staffNames];
  const lines = [header];

  Array.from(sopMap.entries()).forEach(([sopId, data]) => {
    const row = [sopId, data.title, data.version];
    staffNames.forEach((name) => {
      const cell = data.cells.get(name);
      if (!cell) {
        row.push('');
      } else if (cell.compliance_status === 'SIGNED') {
        row.push(`SIGNED (${formatDate(cell.signed_at)})`);
      } else if (cell.compliance_status === 'PENDING') {
        row.push('PENDING');
      } else {
        row.push('N/A');
      }
    });
    lines.push(row);
  });

  const csv = lines
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `belfield-pharmacy-gphc-training-matrix-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function TrainingMatrixGrid({ rows }: { rows: MatrixRow[] }) {
  const staffNames = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.staff_name));
    return Array.from(set).sort();
  }, [rows]);

  const sops = useMemo(() => {
    const map = new Map<string, { title: string; version: string; cells: Map<string, MatrixRow> }>();
    rows.forEach((r) => {
      if (!map.has(r.sop_id)) {
        map.set(r.sop_id, { title: r.sop_title, version: r.version_number, cells: new Map() });
      }
      map.get(r.sop_id)!.cells.set(r.staff_name, r);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-nhs-midgrey">
          {sops.length} SOPs &times; {staffNames.length} staff members
        </p>
        <button onClick={() => downloadCsv(rows, staffNames)} className="btn-primary">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-nhs-paleblue text-nhs-darkblue">
            <tr>
              <th className="sticky left-0 z-10 bg-nhs-paleblue px-3 py-2 text-left font-semibold">
                SOP
              </th>
              {staffNames.map((name) => (
                <th key={name} className="min-w-[120px] px-2 py-2 text-center font-semibold">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-nhs-paleblue">
            {sops.map(([sopId, data]) => (
              <tr key={sopId} className="hover:bg-nhs-paleblue/30">
                <td className="sticky left-0 z-10 bg-white px-3 py-2">
                  <p className="font-semibold text-nhs-darkblue">{sopId}</p>
                  <p className="text-xs text-nhs-midgrey">{data.title}</p>
                </td>
                {staffNames.map((name) => {
                  const cell = data.cells.get(name);
                  return (
                    <td key={name} className="px-2 py-2">
                      {cell ? (
                        <StatusCell status={cell.compliance_status} signedAt={cell.signed_at} />
                      ) : (
                        <div className="rounded bg-gray-100 px-2 py-1.5 text-center text-xs text-gray-400">
                          —
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

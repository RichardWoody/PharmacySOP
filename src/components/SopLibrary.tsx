'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

export interface LibrarySopRow {
  sop_id: string;
  category_id: string;
  category_name: string;
  title: string;
  version_number: string;
  effective_from: string;
  review_due_date: string;
}

function formatDate(value: string | Date | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function SopLibrary({ sops }: { sops: LibrarySopRow[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('ALL');

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    sops.forEach((s) => map.set(s.category_id, s.category_name));
    return Array.from(map.entries());
  }, [sops]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sops.filter((s) => {
      const matchesCategory = category === 'ALL' || s.category_id === category;
      const matchesQuery =
        !q || s.sop_id.toLowerCase().includes(q) || s.title.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [sops, query, category]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nhs-midgrey" />
          <input
            type="text"
            placeholder="Search by SOP ID or title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded border border-nhs-midgrey/40 py-2 pl-9 pr-3 text-sm focus:border-nhs-blue focus:outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded border border-nhs-midgrey/40 px-3 py-2 text-sm focus:border-nhs-blue focus:outline-none sm:w-64"
        >
          <option value="ALL">All Categories</option>
          {categories.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-2 text-xs text-nhs-midgrey">
        Showing {filtered.length} of {sops.length} SOPs
      </p>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-nhs-paleblue text-left text-nhs-darkblue">
            <tr>
              <th className="px-4 py-2 font-semibold">SOP ID</th>
              <th className="px-4 py-2 font-semibold">Title</th>
              <th className="px-4 py-2 font-semibold">Category</th>
              <th className="px-4 py-2 font-semibold">Version</th>
              <th className="px-4 py-2 font-semibold">Effective</th>
              <th className="px-4 py-2 font-semibold">Review Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-nhs-paleblue">
            {filtered.map((s) => (
              <tr key={s.sop_id} className="hover:bg-nhs-paleblue/40">
                <td className="px-4 py-2">
                  <Link
                    href={`/sops/${encodeURIComponent(s.sop_id)}`}
                    className="font-semibold text-nhs-blue hover:underline"
                  >
                    {s.sop_id}
                  </Link>
                </td>
                <td className="px-4 py-2 text-nhs-darkgrey">{s.title}</td>
                <td className="px-4 py-2">
                  <span className="badge bg-nhs-paleblue text-nhs-darkblue">
                    {s.category_name}
                  </span>
                </td>
                <td className="px-4 py-2 text-nhs-midgrey">{s.version_number}</td>
                <td className="px-4 py-2 text-nhs-midgrey">{formatDate(s.effective_from)}</td>
                <td className="px-4 py-2 text-nhs-midgrey">{formatDate(s.review_due_date)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-nhs-midgrey">
                  No SOPs match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

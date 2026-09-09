'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { AlertTriangle, Building2, Phone, Mail } from 'lucide-react';
import Image from 'next/image';

function isCautionText(children: React.ReactNode): boolean {
  const text = String(children);
  return /caution|warning|important|danger/i.test(text.slice(0, 40));
}

const components: Components = {
  h1: ({ children }) => <h1>{children}</h1>,
  h2: ({ children }) => <h2>{children}</h2>,
  h3: ({ children }) => <h3>{children}</h3>,
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table>{children}</table>
    </div>
  ),
  blockquote: ({ children }) => {
    const caution = isCautionText(children);
    return (
      <blockquote className={caution ? '!border-red-500 !bg-red-50' : undefined}>
        {caution && (
          <div className="mb-1 flex items-center gap-1.5 font-bold text-red-700">
            <AlertTriangle className="h-4 w-4" />
            CAUTION
          </div>
        )}
        {children}
      </blockquote>
    );
  },
};

export default function SopMarkdown({ content }: { content: string }) {
  // 1. Automatically strip out any branding placeholder tags
  // 2. Automatically update any older body text dates to October 2026 / September 2028
  const cleanedContent = content
    .replace(/\[BRANDING PLACEHOLDER:.*?\]/gi, '')
    .replace(/01\/05\/2026/g, '01/10/2026')
    .replace(/01\/04\/2028/g, '01/09/2028')
    .replace(/1st May 2026/g, '1st October 2026')
    .replace(/1st April 2028/g, '1st September 2028')
    .trim();

  return (
    <div className="space-y-6">
      {/* SOP Markdown Document Body */}
      <div className="sop-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {cleanedContent}
        </ReactMarkdown>
      </div>

      {/* Official Belfield Pharmacy Document Footer */}
      <div className="mt-8 rounded-lg border border-nhs-midgrey/30 bg-slate-50 p-6 text-sm text-nhs-darkgrey shadow-sm print:border-black">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-nhs-midgrey/20 pb-5">
          <div className="flex items-center gap-4">
            {/* Logo Display */}
            <div className="relative h-12 w-36 overflow-hidden rounded bg-white p-1 shadow-sm border border-slate-200">
              <img
                src="/logo.jpg"
                alt="Belfield Pharmacy Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  // Fallback to green pharmacy cross icon if file is not yet copied
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="flex h-full w-10 items-center justify-center rounded bg-emerald-600 font-bold text-white text-xl leading-none">+</div>';
                }}
              />
            </div>
            <div>
              <p className="font-bold text-nhs-darkblue text-lg leading-tight">Belfield Pharmacy</p>
              <p className="text-xs text-nhs-midgrey">
                NHS Community Pharmacy &bull; ODS Code: <span className="font-semibold text-nhs-darkgrey">FHR07</span>
              </p>
            </div>
          </div>
          <div className="text-xs text-nhs-darkgrey sm:text-right">
            <p className="font-semibold text-nhs-darkblue">Superintendent Pharmacist</p>
            <p>Anjam Rashid (GPhC 2052072)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>134 Belfield Road, Rochdale, OL16 2XN</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Tel: 01706 645179</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>info@belfieldpharmacy.co.uk</span>
          </div>
        </div>
      </div>
    </div>
  );
}

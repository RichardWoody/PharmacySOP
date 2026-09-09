import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Belfield Pharmacy | SOP Portal',
  description: 'Standard Operating Procedures portal for Belfield Pharmacy (ODS: FHR07)',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans">
        <SessionProviderWrapper session={session}>
          <Navbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
          <footer className="border-t border-nhs-paleblue bg-white py-4 text-center text-xs text-nhs-midgrey">
            <p>
              Belfield Pharmacy &middot; ODS Code: FHR07 &middot; Superintendent Pharmacist:
              Anjam Rashid (GPhC 2052072)
            </p>
            <p className="mt-1">
              This portal records staff acknowledgement of Standard Operating Procedures for
              GPhC inspection purposes.
            </p>
          </footer>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

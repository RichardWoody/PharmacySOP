'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ClipboardList, LogIn, LogOut, ShieldCheck, Table2 } from 'lucide-react';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <header className="bg-nhs-blue shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-white" strokeWidth={2.2} />
            <div className="leading-tight">
              <p className="text-base font-bold text-white">Belfield Pharmacy</p>
              <p className="text-xs text-white/80">SOP Portal &middot; ODS FHR07</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink href="/">
              <span className="inline-flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4" />
                Staff Portal
              </span>
            </NavLink>
            {user?.isPharmacist && (
              <>
                <NavLink href="/admin">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    Admin Dashboard
                  </span>
                </NavLink>
                <NavLink href="/admin/matrix">
                  <span className="inline-flex items-center gap-1.5">
                    <Table2 className="h-4 w-4" />
                    Training Matrix
                  </span>
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {status === 'authenticated' && user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight text-white">
                  {user.fullName ?? user.name}
                </p>
                <span className="inline-block rounded-full bg-nhs-warmyellow px-2 py-0.5 text-[11px] font-semibold text-nhs-darkblue">
                  {user.roleName ?? 'Staff'}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="inline-flex items-center gap-1.5 rounded border border-white/30 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn()}
              className="inline-flex items-center gap-1.5 rounded bg-white px-3 py-1.5 text-sm font-semibold text-nhs-blue transition hover:bg-nhs-paleblue"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

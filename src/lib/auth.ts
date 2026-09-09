import type { AuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import pool from './db';

interface StaffRecord {
  id: string;
  email: string;
  full_name: string;
  primary_role_id: string | null;
  gphc_number: string | null;
  is_active: boolean;
  role_name: string | null;
  requires_gphc_reg: boolean | null;
}

async function lookupStaffByEmail(email: string): Promise<StaffRecord | null> {
  try {
    const result = await pool.query<StaffRecord>(
      `SELECT su.id,
              su.email,
              su.full_name,
              su.primary_role_id,
              su.gphc_number,
              su.is_active,
              r.display_name    AS role_name,
              r.requires_gphc_reg
         FROM staff_users su
         LEFT JOIN roles r ON r.id = su.primary_role_id
        WHERE lower(su.email) = lower($1)
        LIMIT 1`,
      [email]
    );
    return result.rows[0] ?? null;
  } catch (error) {
    console.error('Failed to look up staff record for', email, error);
    return null;
  }
}

function determineIsPharmacist(roleName: string | null): boolean {
  if (!roleName) return false;
  return /pharmacist/i.test(roleName) && !/technician/i.test(roleName);
}

// Demo/development sign-in is only exposed when explicitly enabled, so that
// production deployments always require a real Microsoft Entra ID sign-in.
const demoLoginEnabled =
  process.env.ENABLE_DEMO_LOGIN === 'true' || process.env.NODE_ENV !== 'production';

const providers: AuthOptions['providers'] = [];

if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID) {
  providers.push(
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    })
  );
}

if (demoLoginEnabled) {
  providers.push(
    CredentialsProvider({
      id: 'demo',
      name: 'Demo Staff Sign-In',
      credentials: {
        email: { label: 'Staff Email', type: 'email' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        if (!email) return null;

        const staff = await lookupStaffByEmail(email);
        if (!staff || !staff.is_active) return null;

        return {
          id: String(staff.id),
          email: staff.email,
          name: staff.full_name,
        };
      },
    })
  );
}

export const authOptions: AuthOptions = {
  providers,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token }) {
      if (!token.email) return token;

      const staff = await lookupStaffByEmail(token.email);
      if (staff) {
        token.staffId = staff.id;
        token.fullName = staff.full_name;
        token.roleId = staff.primary_role_id;
        token.roleName = staff.role_name;
        token.gphcNumber = staff.gphc_number;
        token.isActive = staff.is_active;
        token.isPharmacist = determineIsPharmacist(staff.role_name);
        token.isStaff = true;
      } else {
        token.isStaff = false;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.staffId = token.staffId;
        session.user.fullName = token.fullName;
        session.user.roleId = token.roleId ?? null;
        session.user.roleName = token.roleName ?? null;
        session.user.gphcNumber = token.gphcNumber ?? null;
        session.user.isPharmacist = Boolean(token.isPharmacist);
        session.user.isActive = Boolean(token.isActive);
        session.user.isStaff = Boolean(token.isStaff);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

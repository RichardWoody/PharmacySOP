import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      staffId?: string;
      fullName?: string;
      roleId?: string | null;
      roleName?: string | null;
      gphcNumber?: string | null;
      isPharmacist?: boolean;
      isActive?: boolean;
      isStaff?: boolean;
    };
  }

  interface User {
    staffId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    staffId?: string;
    fullName?: string;
    roleId?: string | null;
    roleName?: string | null;
    gphcNumber?: string | null;
    isPharmacist?: boolean;
    isActive?: boolean;
    isStaff?: boolean;
  }
}

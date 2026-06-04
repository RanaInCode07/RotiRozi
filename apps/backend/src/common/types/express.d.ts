import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      userId: string;
      tenantId: string;
      outletId: string | null;
      role: Role;
    }
  }
}

export {};

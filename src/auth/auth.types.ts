import { UserRole } from '../generated/prisma/enums';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string | null;
}

export interface JwtPayload {
  sub: string;
}

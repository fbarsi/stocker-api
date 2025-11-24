interface JwtPayload {
  sub: number;
  email: string;
  role?: string;
  companyId?: number;
  branchId?: number;
}

interface RequestWithUser {
  user: AuthenticatedUser;
}

interface AuthenticatedUser {
  userId: number;
  email: string;
  role: string;
  companyId?: number; 
  branchId?: number; 
}

export type { JwtPayload, RequestWithUser, AuthenticatedUser };

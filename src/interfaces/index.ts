interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  companyId: number;
  branchId: number;
}

interface RequestWithUser {
  user: AuthenticatedUser;
}

interface AuthenticatedUser {
  user_id: number;
  email: string;
  role: string;
  companyId: number;
  branchId: number;
}

export type { JwtPayload, RequestWithUser, AuthenticatedUser };

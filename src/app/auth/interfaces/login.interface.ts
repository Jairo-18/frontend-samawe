export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Session {
  accessSessionId: string;
}

export interface RawLoginResponse {
  tokens: Tokens;
  user: User;
  accessSessionId: string;
}

export interface Login {
  email: string;
  password: string;
}

export interface LoginResponse {
  tokens: Tokens;
  user: { id: string; role: string };
}

export interface LoginSuccessInterface {
  tokens: Tokens;
  user: User;
  // role: RoleType;
  session: Session;
}

export interface RoleType {
  roleTypeId: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  role: RoleType;
}

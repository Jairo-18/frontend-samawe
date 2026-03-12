import { RoleType } from '../../shared/interfaces/relatedDataGeneral';
export interface LoginCredentials {
  email: string;
  password: string;
}
export interface Session {
  accessSessionId: string;
}
export interface RawLoginResponse {
  tokens: Tokens;
  user: {
    userId: string;
    roleType: RoleType;
    organizationalId: string | null;
  };
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
  session: Session;
}
export interface User {
  userId: string;
  roleType: RoleType;
  organizationalId: string | null;
}
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}


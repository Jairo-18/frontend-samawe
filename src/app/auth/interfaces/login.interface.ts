export interface RoleType {
  roleTypeId: string;
  code?: string;
  name?: string;
}
export interface LoginCredentials {
  email: string;
  password: string;
  /** Slug del hotel donde buscar la cuenta (`?hotel=` en el login). */
  hotel?: string;
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
  /**
   * La organización en la que OPERA la sesión. Para un super administrador que
   * eligió otra con el selector, es esa (no la suya): todo el panel la usa.
   */
  organizationalId: string | null;
  avatarUrl?: string | null;
  /** Super administrador: su organización propia mientras está en otra. */
  homeOrganizationalId?: string | null;
  /** Super administrador: la organización elegida, si no es la propia. */
  actingOrganization?: ActingOrganization | null;
}

export interface ActingOrganization {
  organizationalId: string;
  name: string;
  slug: string;
}

export interface SwitchOrganizationResponse {
  tokens: Tokens;
  organization: ActingOrganization;
  homeOrganizationalId: string | null;
  isActingOrganization: boolean;
}
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

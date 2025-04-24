export interface Login {
  email: string;
  password: string;
}

export interface LoginResponse {
  tokens: Tokens;
  user: { id: string; role: string };
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  role: string;
}

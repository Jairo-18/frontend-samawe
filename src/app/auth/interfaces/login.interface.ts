export interface Login {
  username: string;
  password: string;
}

export interface LoginResponse {
  tokens: Tokens;
  user: User;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  role: string;
}

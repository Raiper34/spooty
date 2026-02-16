export interface User {
  username: string;
  isAdmin: boolean;
}

export interface LoginResponse {
  access_token: string;
  username: string;
  isAdmin: boolean;
}


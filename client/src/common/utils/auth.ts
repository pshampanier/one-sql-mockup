import { UnionValues } from "./types";

export type AuthenticationMethods = "user_password" | "key" | "token";
export const AUTHENTICATION_METHODS: UnionValues<AuthenticationMethods>[] = ["user_password", "key", "token"];

export interface AuthToken {
  token: string;
  expires: number;
}

export interface AuthTokenResponse {
  token: string;
  expires: number;
}

export type AuthUserPassword = {
  username: string;
  password: string;
};

export type AuthKey = string;

export type AuthCredentials = AuthUserPassword | AuthKey;

export type AuthRequest = {
  method: AuthenticationMethods;
  credentials: AuthCredentials;
};

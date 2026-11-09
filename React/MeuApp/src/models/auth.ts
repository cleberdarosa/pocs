type Json = Record<string, unknown>;

export class FormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FormatError';
  }
}

function requiredString(json: Json, key: string): string {
  const value = json[key] == null ? '' : String(json[key]);
  if (!value) throw new FormatError(`Campo obrigatório ausente: ${key}`);
  return value;
}

function optionalInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function requiredInt(json: Json, key: string): number {
  const value = optionalInt(json[key]);
  if (value === undefined) throw new FormatError(`Campo numérico obrigatório ausente: ${key}`);
  return value;
}

export interface AuthorizationResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  passwordExpiration?: number;
  code: string;
}

export function parseAuthorizationResponse(json: Json): AuthorizationResponse {
  return {
    accessToken: requiredString(json, 'access_token'),
    tokenType: (json.token_type as string | undefined) ?? 'Bearer',
    expiresIn: requiredInt(json, 'expires_in'),
    passwordExpiration: optionalInt(json.pwd_expiration),
    code: requiredString(json, 'code'),
  };
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export function parseTokenResponse(json: Json): TokenResponse {
  return {
    accessToken: requiredString(json, 'access_token'),
    refreshToken: requiredString(json, 'refresh_token'),
    tokenType: (json.token_type as string | undefined) ?? 'Bearer',
    expiresIn: requiredInt(json, 'expires_in'),
  };
}

export interface AuthSession {
  identityAccessToken: string;
  accessToken: string;
  refreshToken: string;
  identityAccessTokenExpiresAt: Date;
  accessTokenExpiresAt: Date;
  cpf: string;
}

const DEFAULT_TOLERANCE_MS = 2 * 60 * 1000;

export function accessTokenIsValid(session: AuthSession, toleranceMs = DEFAULT_TOLERANCE_MS) {
  return (
    session.accessToken.length > 0 &&
    session.accessTokenExpiresAt.getTime() > Date.now() + toleranceMs
  );
}

export function identityAccessTokenIsValid(
  session: AuthSession,
  toleranceMs = DEFAULT_TOLERANCE_MS,
) {
  return (
    session.identityAccessToken.length > 0 &&
    session.identityAccessTokenExpiresAt.getTime() > Date.now() + toleranceMs
  );
}

export type SessionRestoreResult = 'authenticated' | 'unauthenticated';

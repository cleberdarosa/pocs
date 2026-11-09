import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AuthSession } from '@/models/auth';

const Keys = {
  identityAccessToken: 'identity_access_token',
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  identityAccessTokenExpiresAt: 'identity_access_token_expires_at',
  accessTokenExpiresAt: 'access_token_expires_at',
  cpf: 'cpf',
} as const;

// expo-secure-store não existe na Web: lá usamos localStorage (sem criptografia,
// aceitável apenas para desenvolvimento/POC).
const isWeb = Platform.OS === 'web';

const read = async (key: string): Promise<string | null> =>
  isWeb ? globalThis.localStorage?.getItem(key) ?? null : SecureStore.getItemAsync(key);

const write = async (key: string, value: string): Promise<void> =>
  isWeb ? globalThis.localStorage?.setItem(key, value) : SecureStore.setItemAsync(key, value);

const remove = async (key: string): Promise<void> =>
  isWeb ? globalThis.localStorage?.removeItem(key) : SecureStore.deleteItemAsync(key);

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const secureStorage = {
  async saveSession(session: AuthSession): Promise<void> {
    await Promise.all([
      write(Keys.identityAccessToken, session.identityAccessToken),
      write(Keys.accessToken, session.accessToken),
      write(Keys.refreshToken, session.refreshToken),
      write(Keys.identityAccessTokenExpiresAt, session.identityAccessTokenExpiresAt.toISOString()),
      write(Keys.accessTokenExpiresAt, session.accessTokenExpiresAt.toISOString()),
      write(Keys.cpf, session.cpf),
    ]);
  },

  async getSession(): Promise<AuthSession | null> {
    const [identityAccessToken, accessToken, refreshToken, identityExpires, accessExpires, cpf] =
      await Promise.all([
        read(Keys.identityAccessToken),
        read(Keys.accessToken),
        read(Keys.refreshToken),
        read(Keys.identityAccessTokenExpiresAt),
        read(Keys.accessTokenExpiresAt),
        read(Keys.cpf),
      ]);

    const identityAccessTokenExpiresAt = parseDate(identityExpires);
    const accessTokenExpiresAt = parseDate(accessExpires);

    if (
      !identityAccessToken ||
      !accessToken ||
      !refreshToken ||
      !identityAccessTokenExpiresAt ||
      !accessTokenExpiresAt ||
      !cpf
    ) {
      return null;
    }

    return {
      identityAccessToken,
      accessToken,
      refreshToken,
      identityAccessTokenExpiresAt,
      accessTokenExpiresAt,
      cpf,
    };
  },

  getCpf: () => read(Keys.cpf),

  async clear(): Promise<void> {
    await Promise.all(Object.values(Keys).map(remove));
  },
};

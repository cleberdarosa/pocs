import axios, { type AxiosResponse } from 'axios';

import { ApiConstants } from '@/core/constants/api';
import { apiClient } from '@/core/network/apiClient';
import { AppLogger } from '@/core/utils/appLogger';
import {
  FormatError,
  parseAuthorizationResponse,
  parseTokenResponse,
  type AuthorizationResponse,
  type TokenResponse,
} from '@/models/auth';

type Json = Record<string, unknown>;

function responseData(response: AxiosResponse<Json | null>): Json {
  if (response.data == null) throw new FormatError('Resposta da API sem conteúdo.');
  return response.data;
}

function logFailure(message: string, error: unknown) {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  AppLogger.error('AUTH', `${message} HTTP ${status ?? '-'}.`, error);
}

export const authService = {
  async authorization(cpf: string, senha: string): Promise<AuthorizationResponse> {
    AppLogger.auth('Iniciando autorização na API 1.');

    try {
      const response = await apiClient.post<Json>(ApiConstants.authorization, {
        redirect_uri: ApiConstants.redirectUri,
        client_id: ApiConstants.clientId,
        username: cpf,
        password: senha,
      });

      AppLogger.auth(`API 1 concluída. HTTP ${response.status}.`);
      const authorization = parseAuthorizationResponse(responseData(response));
      AppLogger.auth('Resposta da API 1 validada. Código de autorização recebido.');
      return authorization;
    } catch (error) {
      logFailure('Falha na autorização da API 1.', error);
      throw error;
    }
  },

  async accessToken(code: string, authorizationToken: string): Promise<TokenResponse> {
    AppLogger.auth('Iniciando troca do código pelo token principal na API 2.');

    try {
      const response = await apiClient.post<Json>(
        ApiConstants.accessToken,
        { grant_type: 'authorization_code', code },
        {
          headers: {
            'x-authorization': ApiConstants.xAuthorization,
            Authorization: `Bearer ${authorizationToken}`,
          },
        },
      );

      AppLogger.auth(`API 2 concluída. HTTP ${response.status}.`);
      const token = parseTokenResponse(responseData(response));
      AppLogger.auth(`Token principal recebido. Validade informada: ${token.expiresIn} segundos.`);
      return token;
    } catch (error) {
      logFailure('Falha ao obter o token principal.', error);
      throw error;
    }
  },

  async refreshToken(refreshToken: string, identityAccessToken: string): Promise<TokenResponse> {
    AppLogger.auth('Iniciando renovação do token principal.');

    try {
      const response = await apiClient.post<Json>(
        ApiConstants.accessToken,
        { grant_type: 'refresh_token', refresh_token: refreshToken },
        {
          headers: {
            'x-authorization': ApiConstants.xAuthorization,
            Authorization: `Bearer ${identityAccessToken}`,
          },
        },
      );

      AppLogger.auth(`Refresh concluído. HTTP ${response.status}.`);
      const token = parseTokenResponse(responseData(response));
      AppLogger.auth(
        `Novo access token e novo refresh token recebidos. Validade: ${token.expiresIn} segundos.`,
      );
      return token;
    } catch (error) {
      logFailure('Falha ao renovar o token.', error);
      throw error;
    }
  },
};

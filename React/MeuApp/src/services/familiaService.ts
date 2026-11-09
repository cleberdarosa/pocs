import axios from 'axios';

import { ApiConstants } from '@/core/constants/api';
import { secureStorage } from '@/core/storage/secureStorage';
import { apiClient } from '@/core/network/apiClient';
import { AppLogger } from '@/core/utils/appLogger';
import { authRepository } from '@/repositories/authRepository';

type Json = Record<string, unknown>;

export class FamiliaServiceError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'FamiliaServiceError';
  }
}

export class SessionExpiredError extends FamiliaServiceError {
  constructor() {
    super('Sua sessão expirou. Faça login novamente.');
    this.name = 'SessionExpiredError';
  }
}

export const familiaService = {
  async getFamilia(cpf?: string): Promise<Json> {
    AppLogger.familia('Solicitando token válido para consultar a família.');

    const accessToken = await authRepository.getValidAccessToken();

    if (!accessToken) {
      AppLogger.familia('Consulta cancelada porque não existe token válido.');
      throw new SessionExpiredError();
    }

    AppLogger.familia('Token válido disponível.');

    const sessionCpf = cpf ?? authRepository.currentSession?.cpf ?? (await secureStorage.getCpf());

    if (!sessionCpf) {
      AppLogger.familia('Consulta cancelada porque o CPF não foi encontrado.');
      throw new FamiliaServiceError('CPF não encontrado na sessão do usuário.');
    }

    try {
      AppLogger.familia('Chamando API de família.');

      const response = await apiClient.get<Json | null>(ApiConstants.familia(sessionCpf), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      AppLogger.familia(`API de família concluída. HTTP ${response.status}.`);

      const data = response.data;

      if (data == null) {
        AppLogger.familia('API de família retornou resposta vazia.');
        throw new FamiliaServiceError('A API de família retornou uma resposta vazia.');
      }

      const items = data.items;
      AppLogger.familia(
        `Resposta recebida. Quantidade de beneficiários: ${Array.isArray(items) ? items.length : 0}.`,
      );

      return data;
    } catch (error) {
      if (error instanceof FamiliaServiceError) throw error;

      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      AppLogger.error('FAMILIA', `Falha na API de família. HTTP ${status ?? '-'}.`, error);

      if (status === 401) {
        AppLogger.familia('API retornou 401. Limpando a sessão.');
        await authRepository.logout();
        throw new SessionExpiredError();
      }

      throw new FamiliaServiceError('Não foi possível carregar os dados da família.', error);
    }
  },
};

import { create } from 'zustand';

import { AppLogger } from '@/core/utils/appLogger';
import { parseFamilia, type Familia, type PlanoFamilia } from '@/models/familia';
import {
  FamiliaServiceError,
  SessionExpiredError,
  familiaService,
} from '@/services/familiaService';

interface HomeState {
  isLoading: boolean;
  sessionExpired: boolean;
  errorMessage: string | null;
  titular: Familia | null;
  planoAtivo: PlanoFamilia | null;

  loadHome(): Promise<void>;
  clear(): void;
}

export const useHomeStore = create<HomeState>()((set, get) => ({
  isLoading: false,
  sessionExpired: false,
  errorMessage: null,
  titular: null,
  planoAtivo: null,

  async loadHome() {
    if (get().isLoading) {
      AppLogger.home('Carregamento ignorado porque já existe uma operação em andamento.');
      return;
    }

    AppLogger.home('Iniciando carregamento da Home.');
    set({ isLoading: true, errorMessage: null, sessionExpired: false });

    try {
      const response = await familiaService.getFamilia();
      const rawItems = response.items;

      if (!Array.isArray(rawItems) || rawItems.length === 0) {
        throw new FamiliaServiceError('Nenhum beneficiário foi encontrado.');
      }

      AppLogger.home(`Beneficiários recebidos: ${rawItems.length}.`);

      const firstItem = rawItems[0];

      if (firstItem == null || typeof firstItem !== 'object') {
        throw new FamiliaServiceError('Os dados do beneficiário estão em formato inválido.');
      }

      const titular = parseFamilia(firstItem as Record<string, unknown>);
      AppLogger.home(`Beneficiário convertido. Planos encontrados: ${titular.planos.length}.`);

      const planoAtivo = titular.planos.find(
        (plano) => plano.statusCarteira.toLowerCase() === 'ativo',
      );

      if (!planoAtivo) {
        throw new FamiliaServiceError('Nenhum plano ativo foi encontrado.');
      }

      set({ titular, planoAtivo });
      AppLogger.home('Home carregada. Plano ativo encontrado.');
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        AppLogger.home('Sessão expirada durante o carregamento.');
        set({ sessionExpired: true, titular: null, planoAtivo: null, errorMessage: error.message });
      } else if (error instanceof FamiliaServiceError) {
        AppLogger.home(`Falha conhecida: ${error.message}`);
        set({ titular: null, planoAtivo: null, errorMessage: error.message });
      } else {
        AppLogger.error('HOME', 'Erro inesperado ao carregar a Home.', error);
        set({
          titular: null,
          planoAtivo: null,
          errorMessage: 'Não foi possível carregar os dados da Home.',
        });
      }
    } finally {
      set({ isLoading: false });
      AppLogger.home('Carregamento da Home finalizado.');
    }
  },

  clear() {
    AppLogger.home('Limpando dados mantidos pelo HomeStore.');
    set({ titular: null, planoAtivo: null, errorMessage: null, sessionExpired: false });
  },
}));

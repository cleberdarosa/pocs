import { create } from 'zustand';

import { AppLogger } from '@/core/utils/appLogger';
import type { AuthSession } from '@/models/auth';
import { authRepository } from '@/repositories/authRepository';
import { useHomeStore } from '@/stores/homeStore';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: AuthSession | null;

  login(cpf: string, senha: string): Promise<boolean>;
  logout(): Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  session: null,

  async login(cpf, senha) {
    if (get().isLoading) return false;

    set({ isLoading: true });

    try {
      const session = await authRepository.login(cpf, senha);
      set({ session, isAuthenticated: true });
      return true;
    } catch (error) {
      AppLogger.error('AUTH', 'Erro ao realizar login.', error);
      set({ session: null, isAuthenticated: false });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  async logout() {
    await authRepository.logout();
    useHomeStore.getState().clear();
    set({ session: null, isAuthenticated: false });
  },
}));

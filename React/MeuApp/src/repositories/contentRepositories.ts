import { AppLogger } from '@/core/utils/appLogger';
import type { AppAlertConfig } from '@/models/appAlert';
import type { BottomNavItem } from '@/models/bottomNavItem';
import type { MenuItem } from '@/models/menuItem';
import {
  assetAlertDialogDataSource,
  assetBottomNavDataSource,
  assetMenuDataSource,
  type AlertDialogDataSource,
  type BottomNavDataSource,
  type MenuDataSource,
} from '@/services/dataSources';

// ---------- Menu ----------

function onlyEnabledMenu(items: MenuItem[]): MenuItem[] {
  return items
    .filter((item) => item.enabled)
    .map((item) => ({ ...item, children: onlyEnabledMenu(item.children) }));
}

export function createMenuRepository(primary: MenuDataSource, fallback?: MenuDataSource) {
  return {
    async getMenu(): Promise<MenuItem[]> {
      try {
        return onlyEnabledMenu((await primary.getMenu()).items);
      } catch (error) {
        if (!fallback) throw error;
        return onlyEnabledMenu((await fallback.getMenu()).items);
      }
    },
  };
}

export const menuRepository = createMenuRepository(assetMenuDataSource);

// ---------- Bottom navigation ----------

export function createBottomNavRepository(
  primary: BottomNavDataSource,
  fallback?: BottomNavDataSource,
) {
  let cache: BottomNavItem[] | null = null;

  const saveCache = (items: BottomNavItem[]) => {
    cache = items.filter((item) => item.enabled).sort((a, b) => a.order - b.order);
    return cache;
  };

  return {
    async getBottomNavigation(forceRefresh = false): Promise<BottomNavItem[]> {
      if (!forceRefresh && cache) return cache;

      try {
        return saveCache((await primary.getBottomNavigation()).items);
      } catch (error) {
        if (!fallback) throw error;
        return saveCache((await fallback.getBottomNavigation()).items);
      }
    },
    getCached: () => cache,
    clearCache() {
      cache = null;
    },
  };
}

export const bottomNavRepository = createBottomNavRepository(assetBottomNavDataSource);

// ---------- Alert dialogs ----------

const alertLog = (message: string) => AppLogger.session(`[ALERT-DIALOG][REPOSITORY] ${message}`);

export function createAlertDialogRepository(dataSource: AlertDialogDataSource) {
  return {
    async getAll(onlyEnabled = true): Promise<AppAlertConfig[]> {
      alertLog(`Solicitando todas as configurações. Somente habilitadas: ${onlyEnabled}.`);
      try {
        const items = await dataSource.getAll();
        const result = onlyEnabled ? items.filter((item) => item.enabled) : [...items];
        alertLog(`Configurações retornadas pelo Repository: ${result.length}.`);
        return result;
      } catch (error) {
        AppLogger.error('ALERT-DIALOG-REPOSITORY', 'Falha ao recuperar as configurações.', error);
        throw error;
      }
    },

    async getById(id: string, requireEnabled = true): Promise<AppAlertConfig | null> {
      alertLog(`Solicitando configuração pelo ID: ${id}. Exigir habilitado: ${requireEnabled}.`);
      try {
        const config = await dataSource.getById(id);
        if (!config) {
          alertLog(`Configuração não encontrada. ID: ${id}.`);
          return null;
        }
        if (requireEnabled && !config.enabled) {
          alertLog(`Configuração encontrada, mas está desabilitada. ID: ${id}.`);
          return null;
        }
        alertLog(`Configuração disponível. ID: ${config.id}; tipo: ${config.type}.`);
        return config;
      } catch (error) {
        AppLogger.error('ALERT-DIALOG-REPOSITORY', `Falha ao recuperar a configuração ${id}.`, error);
        throw error;
      }
    },
  };
}

export const alertDialogRepository = createAlertDialogRepository(assetAlertDialogDataSource);

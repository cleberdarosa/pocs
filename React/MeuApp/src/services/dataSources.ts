/**
 * Fontes de dados de menu, bottom navigation e modais.
 * Hoje leem os JSONs mockados em `assets/mocks`; as variantes de API ficam
 * prontas para quando os endpoints existirem.
 */
import alertDialogsMock from '@/assets/mocks/alert_dialogs.json';
import bottomNavigationMock from '@/assets/mocks/bottom_navigation.json';
import menuMock from '@/assets/mocks/menu.json';
import { AppLogger } from '@/core/utils/appLogger';
import { parseAppAlertConfig, type AppAlertConfig } from '@/models/appAlert';
import { FormatError } from '@/models/auth';
import {
  parseBottomNavigationResponse,
  type BottomNavigationResponse,
} from '@/models/bottomNavItem';
import { parseMenuResponse, type MenuResponse } from '@/models/menuItem';

type Json = Record<string, unknown>;

// ---------- Menu ----------

export interface MenuDataSource {
  getMenu(): Promise<MenuResponse>;
}

export const assetMenuDataSource: MenuDataSource = {
  getMenu: async () => parseMenuResponse(menuMock as Json),
};

export const apiMenuDataSource = (requestMenu: () => Promise<Json>): MenuDataSource => ({
  getMenu: async () => parseMenuResponse(await requestMenu()),
});

// ---------- Bottom navigation ----------

export interface BottomNavDataSource {
  getBottomNavigation(): Promise<BottomNavigationResponse>;
}

export const assetBottomNavDataSource: BottomNavDataSource = {
  getBottomNavigation: async () => parseBottomNavigationResponse(bottomNavigationMock as Json),
};

export const apiBottomNavDataSource = (
  requestBottomNavigation: () => Promise<Json>,
): BottomNavDataSource => ({
  getBottomNavigation: async () => parseBottomNavigationResponse(await requestBottomNavigation()),
});

// ---------- Alert dialogs ----------

export interface AlertDialogDataSource {
  getAll(): Promise<AppAlertConfig[]>;
  getById(id: string): Promise<AppAlertConfig | null>;
}

const alertLog = (message: string) => AppLogger.session(`[ALERT-DIALOG][ASSET] ${message}`);

export const assetAlertDialogDataSource: AlertDialogDataSource = {
  async getAll() {
    alertLog('Iniciando leitura das configurações mockadas.');
    const start = Date.now();

    try {
      const decoded = alertDialogsMock as unknown;

      if (decoded == null || typeof decoded !== 'object' || Array.isArray(decoded)) {
        throw new FormatError('A raiz do JSON de modais deve ser um objeto.');
      }

      const rawItems = (decoded as Json).items;

      if (!Array.isArray(rawItems)) {
        throw new FormatError('A propriedade "items" deve ser uma lista.');
      }

      alertLog(`Registros encontrados no JSON: ${rawItems.length}.`);

      const items = rawItems.map((raw, index) => {
        if (raw == null || typeof raw !== 'object') {
          throw new FormatError(`O modal na posição ${index} não possui um objeto JSON válido.`);
        }
        const model = parseAppAlertConfig(raw as Json);
        alertLog(
          `Modal convertido. ID: ${model.id}; tipo: ${model.type}; habilitado: ${model.enabled}.`,
        );
        return model;
      });

      alertLog(
        `Configurações carregadas com sucesso. Quantidade: ${items.length}; tempo: ${Date.now() - start} ms.`,
      );

      return items;
    } catch (error) {
      AppLogger.error(
        'ALERT-DIALOG',
        `Falha ao carregar as configurações mockadas. Tempo: ${Date.now() - start} ms.`,
        error,
      );
      throw error;
    }
  },

  async getById(id) {
    const normalizedId = id.trim();
    alertLog(`Procurando configuração pelo ID: ${normalizedId}.`);

    if (!normalizedId) {
      alertLog('Busca cancelada porque o ID está vazio.');
      return null;
    }

    const items = await this.getAll();
    const found = items.find((item) => item.id === normalizedId) ?? null;

    alertLog(
      found
        ? `Configuração encontrada. ID: ${found.id}; tipo: ${found.type}.`
        : `Nenhuma configuração encontrada para o ID: ${normalizedId}.`,
    );

    return found;
  },
};

export const apiAlertDialogDataSource: AlertDialogDataSource = {
  async getAll() {
    AppLogger.session('[ALERT-DIALOG][API] Operação indisponível: API ainda não existe.');
    throw new Error('API de configuração de modais ainda não disponível.');
  },
  async getById() {
    AppLogger.session('[ALERT-DIALOG][API] Operação indisponível: API ainda não existe.');
    throw new Error('API de configuração de modais ainda não disponível.');
  },
};

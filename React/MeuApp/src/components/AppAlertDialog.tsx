import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { create } from 'zustand';

import { AppButton } from '@/components/AppButton';
import { Icon, type IconName } from '@/components/Icon';
import { Colors, TextStyles, withAlpha } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';
import { AppLogger } from '@/core/utils/appLogger';
import type { AppAlertConfig, AppAlertResult, AppAlertType } from '@/models/appAlert';

const log = (message: string) => AppLogger.session(`[ALERT-DIALOG][WIDGET] ${message}`);

interface PendingAlert {
  config: AppAlertConfig;
  resolve: (result: AppAlertResult) => void;
}

const useAlertStore = create<{ current: PendingAlert | null }>()(() => ({ current: null }));

/**
 * Exibe o modal configurado e resolve com a ação do usuário,
 * equivalente ao `AppAlertDialog.show` do Flutter.
 * Requer `<AppAlertDialogHost />` montado no layout raiz.
 */
export function showAppAlert(config: AppAlertConfig): Promise<AppAlertResult> {
  log(
    `Solicitada abertura do modal. ID: ${config.id}; tipo: ${config.type}; dismissible: ${config.dismissible}.`,
  );

  if (!config.enabled) {
    log(`Modal não aberto porque está desabilitado. ID: ${config.id}.`);
    return Promise.resolve('dismissed');
  }

  const openedAt = Date.now();

  return new Promise<AppAlertResult>((resolve) => {
    // Se já houver um modal aberto, ele é fechado como "dismissed".
    useAlertStore.getState().current?.resolve('dismissed');

    useAlertStore.setState({
      current: {
        config,
        resolve: (result) => {
          useAlertStore.setState({ current: null });
          log(
            `Modal finalizado. ID: ${config.id}; resultado: ${result}; tempo aberto: ${Date.now() - openedAt} ms.`,
          );
          resolve(result);
        },
      },
    });
  });
}

const ICONS: Record<string, IconName> = {
  success: 'check-circle-outline',
  check: 'check-circle-outline',
  warning: 'warning-amber',
  attention: 'warning-amber',
  error: 'error-outline',
  question: 'help-outline',
  confirmation: 'help-outline',
  info: 'info-outline',
  information: 'info-outline',
};

const DEFAULT_ICONS: Record<AppAlertType, IconName> = {
  information: 'info-outline',
  success: 'check-circle-outline',
  warning: 'warning-amber',
  error: 'error-outline',
  confirmation: 'help-outline',
};

export const alertTypeIcon = (type: AppAlertType) => DEFAULT_ICONS[type];

const resolveIcon = (icon: string, type: AppAlertType) =>
  ICONS[icon.trim().toLowerCase()] ?? DEFAULT_ICONS[type];

function visualStyle(type: AppAlertType) {
  switch (type) {
    case 'warning':
      return {
        iconColor: Colors.tertiary,
        backgroundColor: Colors.tertiaryContainer,
        actionColor: Colors.tertiary,
      };
    case 'error':
      return {
        iconColor: Colors.error,
        backgroundColor: Colors.errorContainer,
        actionColor: Colors.error,
      };
    case 'confirmation':
      return {
        iconColor: Colors.secondary,
        backgroundColor: withAlpha(Colors.secondary, 0.12),
        actionColor: Colors.secondary,
      };
    default:
      return {
        iconColor: Colors.primary,
        backgroundColor: withAlpha(Colors.primary, 0.12),
        actionColor: Colors.primary,
      };
  }
}

export function AppAlertDialogHost() {
  const current = useAlertStore((state) => state.current);

  if (!current) return null;

  const { config, resolve } = current;
  const style = visualStyle(config.type);

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (config.dismissible) resolve('dismissed');
      }}>
      <Pressable
        style={styles.barrier}
        accessibilityLabel="Fechar"
        onPress={() => {
        if (config.dismissible) resolve('dismissed');
      }}>
        <Pressable style={styles.dialog} accessibilityViewIsModal>
          <View style={[styles.iconCircle, { backgroundColor: style.backgroundColor }]}>
            <Icon
              name={resolveIcon(config.icon, config.type)}
              size={DS.actionIconSize}
              color={style.iconColor}
            />
          </View>

          <Text style={[TextStyles.titleMedium, styles.center]} accessibilityRole="header">
            {config.title}
          </Text>
          <Text style={[TextStyles.body, styles.center, styles.message]}>{config.message}</Text>

          <View style={styles.actions}>
            {config.cancelLabel && (
              <AppButton
                variant="outlined"
                title={config.cancelLabel}
                color={Colors.primary}
                onPress={() => {
                  log(`Botão secundário selecionado. ID: ${config.id}.`);
                  resolve('cancelled');
                }}
              />
            )}
            <AppButton
              title={config.confirmLabel}
              color={style.actionColor}
              onPress={() => {
                log(`Botão principal selecionado. ID: ${config.id}.`);
                resolve('confirmed');
              }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  barrier: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.54)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DS.spaceLg,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.white,
    borderRadius: DS.radiusLg,
    padding: DS.spaceLg,
    alignItems: 'center',
  },
  iconCircle: {
    width: DS.spaceXXl,
    height: DS.spaceXXl,
    borderRadius: DS.spaceXXl / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DS.spaceLg,
  },
  center: {
    textAlign: 'center',
  },
  message: {
    marginTop: DS.spaceMd,
    marginBottom: DS.spaceLg,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: DS.spaceSm,
  },
});

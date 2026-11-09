import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { alertTypeIcon, showAppAlert } from '@/components/AppAlertDialog';
import { AppBottomNav } from '@/components/AppBottomNav';
import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { AppHeader } from '@/components/AppHeader';
import { Icon } from '@/components/Icon';
import { Colors, TextStyles, withAlpha } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';
import { AppLogger } from '@/core/utils/appLogger';
import { useGoBack } from '@/hooks/useGoBack';
import {
  AppAlertResultLabel,
  type AppAlertConfig,
  type AppAlertResult,
  type AppAlertType,
} from '@/models/appAlert';
import { alertDialogRepository } from '@/repositories/contentRepositories';

const log = (message: string) => AppLogger.session(`[ALERT-DIALOG][DEMO] ${message}`);

const TYPE_LABELS: Record<AppAlertType, string> = {
  information: 'Informação',
  success: 'Sucesso',
  warning: 'Atenção',
  error: 'Erro',
  confirmation: 'Confirmação',
};

export default function AlertDialogDemoScreen() {
  const goBack = useGoBack('/menu');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [configs, setConfigs] = useState<AppAlertConfig[]>([]);
  const [last, setLast] = useState<{ title: string; result: AppAlertResult } | null>(null);

  const loadConfigs = useCallback(async () => {
    log('Iniciando carregamento dos modais.');
    try {
      const result = await alertDialogRepository.getAll();
      setErrorMessage(null);
      log(`Configurações recebidas pela página: ${result.length}.`);
      setConfigs(result);
    } catch (error) {
      AppLogger.error('ALERT-DIALOG-DEMO', 'Falha ao carregar as configurações.', error);
      setErrorMessage('Não foi possível carregar os modais.');
    } finally {
      setIsLoading(false);
      log('Carregamento da página finalizado.');
    }
  }, []);

  useEffect(() => {
    alertDialogRepository
      .getAll()
      .then(setConfigs)
      .catch(() => setErrorMessage('Não foi possível carregar os modais.'))
      .finally(() => setIsLoading(false));
  }, []);

  const openAlert = async (config: AppAlertConfig) => {
    log(`Solicitada abertura do modal: ${config.id}.`);
    const result = await showAppAlert(config);
    setLast({ title: config.title, result });
    log(`Resultado recebido pela página. Modal: ${config.id}; resultado: ${result}.`);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConfigs();
    setRefreshing(false);
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.centered}>
          <Icon name="error-outline" size={DS.spaceXXl} color={Colors.error} />
          <Text style={[TextStyles.body, styles.center]}>{errorMessage}</Text>
          <AppButton
            title="Tentar novamente"
            icon="refresh"
            onPress={() => {
              setIsLoading(true);
              loadConfigs();
            }}
          />
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={TextStyles.titleLarge}>Modais disponíveis</Text>
        <Text style={[TextStyles.body, styles.subtitle]}>
          Selecione um exemplo para validar o comportamento do componente.
        </Text>

        {last && (
          <AppCard style={[styles.row, styles.lastResult]}>
            <Icon name="history" color={Colors.primary} />
            <View style={styles.flex}>
              <Text style={TextStyles.actionTitle}>Último resultado</Text>
              <Text style={TextStyles.body}>
                {last.title}: {AppAlertResultLabel[last.result]}
              </Text>
            </View>
          </AppCard>
        )}

        {configs.map((config) => (
          <AppCard key={config.id} style={styles.row}>
            <View style={styles.avatar}>
              <Icon name={alertTypeIcon(config.type)} color={Colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={TextStyles.actionTitle}>{config.title}</Text>
              <Text style={TextStyles.bodySmall}>{TYPE_LABELS[config.type]}</Text>
              <Text style={TextStyles.bodySmall}>
                {config.dismissible ? 'Permite fechamento externo' : 'Exige uma ação do usuário'}
              </Text>
            </View>
            <AppButton title="Abrir" onPress={() => openAlert(config)} />
          </AppCard>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.screen}>
      <AppHeader title="Modal de aviso" onBack={goBack} />
      <View style={styles.flex}>{renderBody()}</View>
      <AppBottomNav currentItemId="menu" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1, gap: DS.spaceXs },
  center: { textAlign: 'center' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DS.spaceLg,
    gap: DS.spaceMd,
  },
  content: { padding: DS.spaceLg, gap: DS.spaceMd },
  subtitle: { marginBottom: DS.spaceSm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spaceMd,
    padding: DS.spaceMd,
  },
  lastResult: { backgroundColor: withAlpha(Colors.primary, 0.08) },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: withAlpha(Colors.primary, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

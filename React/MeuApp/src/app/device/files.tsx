import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBottomNav } from '@/components/AppBottomNav';
import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { AppHeader } from '@/components/AppHeader';
import { Icon, type IconName } from '@/components/Icon';
import { Colors, TextStyles } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';
import { AppLogger } from '@/core/utils/appLogger';
import { MessageCard, PermissionHeader, deviceStyles } from '@/features/device/components';
import { useGoBack } from '@/hooks/useGoBack';

const log = (message: string) => AppLogger.session(`[DEVICE][FILES] ${message}`);

type Asset = DocumentPicker.DocumentPickerAsset;

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

function extensionOf(name: string) {
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index + 1).toLowerCase() : '';
}

function formatSize(bytes?: number) {
  if (bytes == null) return 'tamanho desconhecido';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(extension: string): IconName {
  if (extension === 'pdf') return 'picture-as-pdf';
  if (['jpg', 'jpeg', 'png'].includes(extension)) return 'image';
  return 'description';
}

export default function FilesPermissionScreen() {
  const goBack = useGoBack('/menu');
  const [file, setFile] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const pickFile = async () => {
    if (isLoading) return;
    setIsLoading(true);
    log('Abrindo o seletor nativo de arquivos. Tipos permitidos: PDF, JPG, JPEG e PNG.');

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_TYPES,
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.assets.length === 0) {
        log('Seleção de arquivo cancelada pelo usuário.');
        setMessage('Seleção cancelada.');
        return;
      }

      const selected = result.assets[0];
      log(`Arquivo selecionado: ${selected.name}; ${selected.size ?? '-'} bytes; uri: ${selected.uri}.`);
      setFile(selected);
      setMessage('Arquivo selecionado com sucesso.');
    } catch (error) {
      AppLogger.error('DEVICE-FILES', 'Falha ao selecionar arquivo.', error);
      setMessage('Não foi possível selecionar o arquivo.');
    } finally {
      setIsLoading(false);
    }
  };

  const openSettings = async () => {
    log('Solicitada abertura das configurações do aplicativo.');
    try {
      await Linking.openSettings();
    } catch (error) {
      AppLogger.error('DEVICE-FILES', 'Falha ao abrir as configurações.', error);
      setMessage('Não foi possível abrir as configurações.');
    }
  };

  const clearFile = () => {
    if (!file) return;
    log(`Removendo da página a referência ao arquivo ${file.name}.`);
    setFile(null);
    setMessage('Seleção removida.');
  };

  const extension = file ? extensionOf(file.name) : '';

  return (
    <View style={deviceStyles.screen}>
      <AppHeader title="Acesso a arquivos" onBack={goBack} />
      <ScrollView contentContainerStyle={deviceStyles.content}>
        <PermissionHeader
          icon="folder-open"
          title="Arquivos"
          description="O seletor nativo permite escolher explicitamente um documento do dispositivo. A aplicação não solicita acesso irrestrito ao armazenamento."
          status="Seletor nativo disponível"
          statusIcon="check-circle-outline"
        />

        {file && (
          <AppCard style={styles.fileCard}>
            <Icon name={fileIcon(extension)} color={Colors.primary} size={DS.actionIconSize} />
            <View style={styles.fileInfo}>
              <Text style={TextStyles.actionTitle} numberOfLines={2}>
                {file.name}
              </Text>
              <Text style={TextStyles.bodySmall}>
                {(extension || 'arquivo').toUpperCase()} • {formatSize(file.size)}
              </Text>
              <Text style={TextStyles.bodySmall}>Arquivo disponível localmente</Text>
            </View>
            <Pressable accessibilityLabel="Remover seleção" onPress={clearFile} hitSlop={8}>
              <Icon name="close" color={Colors.textSecondary} />
            </Pressable>
          </AppCard>
        )}

        {message && <MessageCard message={message} />}

        <AppButton
          title="Selecionar arquivo"
          icon="attach-file"
          disabled={isLoading}
          onPress={pickFile}
        />
        <AppButton
          variant="outlined"
          title="Abrir configurações do aplicativo"
          icon="settings"
          disabled={isLoading}
          onPress={openSettings}
        />
        {isLoading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={TextStyles.body}>Aguardando seleção...</Text>
          </View>
        )}
      </ScrollView>
      <AppBottomNav currentItemId="menu" />
    </View>
  );
}

const styles = StyleSheet.create({
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spaceMd,
    padding: DS.spaceMd,
  },
  fileInfo: {
    flex: 1,
    gap: DS.spaceXs,
  },
  loading: {
    alignItems: 'center',
    gap: DS.spaceSm,
  },
});

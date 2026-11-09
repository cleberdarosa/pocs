import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, View } from 'react-native';

import { AppBottomNav } from '@/components/AppBottomNav';
import { AppButton } from '@/components/AppButton';
import { AppHeader } from '@/components/AppHeader';
import { Colors } from '@/core/theme/appTheme';
import { AppLogger } from '@/core/utils/appLogger';
import {
  MessageCard,
  PermissionHeader,
  deviceStyles,
  formatPermissionStatus,
  isPermanentlyDenied,
} from '@/features/device/components';
import { useGoBack } from '@/hooks/useGoBack';

const log = (message: string) => AppLogger.session(`[DEVICE][GALLERY] ${message}`);

type Permission = ImagePicker.MediaLibraryPermissionResponse;

const isLimited = (permission: Permission | null) => permission?.accessPrivileges === 'limited';

export default function GalleryPermissionScreen() {
  const goBack = useGoBack('/menu');
  const [permission, setPermission] = useState<Permission | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const checkPermission = useCallback(async () => {
    log('Verificando permissão da galeria.');
    const status = await ImagePicker.getMediaLibraryPermissionsAsync();
    log(`Status atual da galeria: ${status.status}.`);
    setPermission(status);
  }, []);

  useEffect(() => {
    ImagePicker.getMediaLibraryPermissionsAsync().then(setPermission);
  }, []);

  const requestPermission = async () => {
    if (isLoading) return;
    setIsLoading(true);
    log('Solicitando acesso à galeria.');

    try {
      const status = await ImagePicker.requestMediaLibraryPermissionsAsync();
      log(`Resultado da solicitação da galeria: ${status.status}.`);
      setPermission(status);
      setMessage(
        status.granted || isLimited(status)
          ? 'Acesso à galeria disponível.'
          : isPermanentlyDenied(status)
            ? 'O acesso foi bloqueado. Abra as configurações para autorizar.'
            : 'Acesso à galeria não autorizado.',
      );
    } catch (error) {
      AppLogger.error('DEVICE-GALLERY', 'Falha ao solicitar acesso à galeria.', error);
      setMessage('Não foi possível solicitar a permissão.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    if (isLoading) return;
    setIsLoading(true);
    log('Abrindo o seletor nativo de imagens.');

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.9,
      });

      if (result.canceled) {
        log('Seleção de imagem cancelada.');
        setMessage('Seleção cancelada.');
        return;
      }

      const asset = result.assets[0];
      log(`Imagem selecionada. Nome: ${asset.fileName ?? '-'}; tamanho: ${asset.fileSize ?? '-'} bytes.`);
      setImageUri(asset.uri);
      setMessage('Imagem selecionada com sucesso.');
      await checkPermission();
    } catch (error) {
      AppLogger.error('DEVICE-GALLERY', 'Falha ao selecionar imagem.', error);
      setMessage('Falha ao acessar a galeria.');
    } finally {
      setIsLoading(false);
    }
  };

  const statusLabel =
    permission && !permission.granted && permission.canAskAgain
      ? 'Não permitido ou não exigido pela plataforma'
      : formatPermissionStatus(permission, { limited: isLimited(permission) });

  return (
    <View style={deviceStyles.screen}>
      <AppHeader title="Acesso à galeria" onBack={goBack} />
      <ScrollView contentContainerStyle={deviceStyles.content}>
        <PermissionHeader
          icon="photo-library"
          title="Galeria"
          description="Selecione uma imagem da biblioteca do dispositivo. No iOS, o acesso pode ser limitado a fotos escolhidas pelo usuário."
          status={statusLabel}
        />
        {imageUri && (
          <Image source={{ uri: imageUri }} style={deviceStyles.preview} contentFit="cover" />
        )}
        {message && <MessageCard message={message} />}
        <AppButton
          title="Solicitar acesso"
          icon="lock-open"
          disabled={isLoading}
          onPress={requestPermission}
        />
        <AppButton
          variant="outlined"
          title="Selecionar imagem"
          icon="image-search"
          disabled={isLoading}
          onPress={pickImage}
        />
        {isPermanentlyDenied(permission) && (
          <AppButton
            variant="text"
            title="Abrir configurações"
            icon="settings"
            onPress={() => Linking.openSettings()}
          />
        )}
        {isLoading && <ActivityIndicator size="large" color={Colors.primary} />}
      </ScrollView>
      <AppBottomNav currentItemId="menu" />
    </View>
  );
}

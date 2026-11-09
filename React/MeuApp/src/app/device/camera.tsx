import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
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

const log = (message: string) => AppLogger.session(`[DEVICE][CAMERA] ${message}`);

export default function CameraPermissionScreen() {
  const goBack = useGoBack('/menu');
  const [permission, setPermission] = useState<ImagePicker.PermissionResponse | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    log('Verificando permissão da câmera.');
    ImagePicker.getCameraPermissionsAsync().then((status) => {
      log(`Status atual da câmera: ${status.status}.`);
      setPermission(status);
    });
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (isLoading) return false;
    setIsLoading(true);
    log('Solicitando permissão da câmera ao sistema operacional.');

    try {
      const status = await ImagePicker.requestCameraPermissionsAsync();
      log(`Resultado da solicitação da câmera: ${status.status}.`);
      setPermission(status);
      setMessage(
        status.granted
          ? 'Acesso à câmera autorizado.'
          : isPermanentlyDenied(status)
            ? 'O acesso foi bloqueado. Abra as configurações para autorizar.'
            : 'Acesso à câmera não autorizado.',
      );
      return status.granted;
    } catch (error) {
      AppLogger.error('DEVICE-CAMERA', 'Falha ao solicitar permissão da câmera.', error);
      setMessage('Não foi possível solicitar a permissão.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const takePicture = async () => {
    if (isLoading) return;

    const status = await ImagePicker.getCameraPermissionsAsync();
    log(`Tentativa de abrir a câmera. Status: ${status.status}.`);

    if (!status.granted) {
      setPermission(status);
      if (!(await requestPermission())) return;
    }

    setIsLoading(true);
    log('Abrindo a interface nativa de captura de imagem.');

    try {
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.85 });

      if (result.canceled) {
        log('Captura cancelada pelo usuário.');
        setMessage('Captura cancelada.');
        return;
      }

      const asset = result.assets[0];
      log(`Imagem capturada. Nome: ${asset.fileName ?? '-'}; tamanho: ${asset.fileSize ?? '-'} bytes.`);
      setImageUri(asset.uri);
      setMessage('Imagem capturada com sucesso.');
    } catch (error) {
      AppLogger.error('DEVICE-CAMERA', 'Falha ao capturar imagem.', error);
      setMessage('Falha ao abrir a câmera.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={deviceStyles.screen}>
      <AppHeader title="Acesso à câmera" onBack={goBack} />
      <ScrollView contentContainerStyle={deviceStyles.content}>
        <PermissionHeader
          icon="photo-camera"
          title="Câmera"
          description="Permita o acesso para fotografar documentos e imagens diretamente pelo aplicativo."
          status={formatPermissionStatus(permission)}
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
          title="Abrir câmera e fotografar"
          icon="photo-camera"
          disabled={isLoading}
          onPress={takePicture}
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

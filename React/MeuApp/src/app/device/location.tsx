import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBottomNav } from '@/components/AppBottomNav';
import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { AppHeader } from '@/components/AppHeader';
import { Colors, TextStyles } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';
import { AppLogger } from '@/core/utils/appLogger';
import {
  MessageCard,
  PermissionHeader,
  deviceStyles,
  isPermanentlyDenied,
} from '@/features/device/components';
import { useGoBack } from '@/hooks/useGoBack';

const log = (message: string) => AppLogger.session(`[DEVICE][LOCATION] ${message}`);

type Permission = Location.LocationPermissionResponse;

function statusLabel(serviceEnabled: boolean | null, permission: Permission | null) {
  if (serviceEnabled === false) return 'Serviço de localização desligado';
  if (!permission) return 'Verificando...';
  if (permission.granted) {
    return permission.ios?.scope === 'always'
      ? 'Permitido sempre'
      : 'Permitido durante o uso';
  }
  if (isPermanentlyDenied(permission)) return 'Bloqueado permanentemente';
  return 'Não permitido';
}

export default function LocationPermissionScreen() {
  const goBack = useGoBack('/menu');
  const [permission, setPermission] = useState<Permission | null>(null);
  const [serviceEnabled, setServiceEnabled] = useState<boolean | null>(null);
  const [position, setPosition] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      log('Verificando serviço e permissão de localização.');
      try {
        const [enabled, status] = await Promise.all([
          Location.hasServicesEnabledAsync(),
          Location.getForegroundPermissionsAsync(),
        ]);
        log(`Serviço habilitado: ${enabled}; permissão: ${status.status}.`);
        setServiceEnabled(enabled);
        setPermission(status);
      } catch (error) {
        AppLogger.error('DEVICE-LOCATION', 'Falha ao verificar localização.', error);
      }
    })();
  }, []);

  const ensureService = async (offMessage: string) => {
    const enabled = await Location.hasServicesEnabledAsync();
    setServiceEnabled(enabled);
    if (!enabled) {
      log('Serviço de localização está desligado.');
      setMessage(offMessage);
    }
    return enabled;
  };

  const requestPermission = async () => {
    if (isLoading) return;
    setIsLoading(true);
    log('Solicitando permissão de localização.');

    try {
      if (!(await ensureService('Ative a localização do dispositivo para continuar.'))) return;

      const status = await Location.requestForegroundPermissionsAsync();
      log(`Resultado da solicitação de localização: ${status.status}.`);
      setPermission(status);
      setMessage(
        status.granted
          ? 'Acesso à localização autorizado.'
          : isPermanentlyDenied(status)
            ? 'A permissão foi bloqueada. Abra as configurações para autorizar.'
            : 'Acesso à localização não autorizado.',
      );
    } catch (error) {
      AppLogger.error('DEVICE-LOCATION', 'Falha ao solicitar localização.', error);
      setMessage('Não foi possível solicitar a localização.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentPosition = async () => {
    if (isLoading) return;
    setIsLoading(true);
    log('Solicitando posição atual do dispositivo.');

    try {
      if (!(await ensureService('O serviço de localização está desligado.'))) return;

      let status = await Location.getForegroundPermissionsAsync();
      if (!status.granted && status.canAskAgain) {
        status = await Location.requestForegroundPermissionsAsync();
      }
      setPermission(status);

      if (!status.granted) {
        log(`Posição não solicitada. Permissão atual: ${status.status}.`);
        setMessage('A localização não está autorizada.');
        return;
      }

      const current = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tempo limite de 20 segundos excedido.')), 20_000),
        ),
      ]);

      log(
        `Posição obtida. Latitude: ${current.coords.latitude}; longitude: ${current.coords.longitude}; precisão: ${current.coords.accuracy} m.`,
      );
      setPosition(current);
      setMessage('Localização obtida com sucesso.');
    } catch (error) {
      AppLogger.error('DEVICE-LOCATION', 'Falha ao obter posição atual.', error);
      setMessage('Não foi possível obter a localização.');
    } finally {
      setIsLoading(false);
    }
  };

  const openLocationSettings = () => {
    log('Abrindo configurações de localização do dispositivo.');
    if (Platform.OS === 'android') {
      Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={deviceStyles.screen}>
      <AppHeader title="Acesso à localização" onBack={goBack} />
      <ScrollView contentContainerStyle={deviceStyles.content}>
        <PermissionHeader
          icon="location-on"
          title="Localização"
          description="Autorize a localização durante o uso do aplicativo para testar serviços próximos."
          status={statusLabel(serviceEnabled, permission)}
        />

        {position && (
          <AppCard style={styles.position}>
            <Text style={TextStyles.body}>Latitude: {position.coords.latitude.toFixed(6)}</Text>
            <Text style={TextStyles.body}>Longitude: {position.coords.longitude.toFixed(6)}</Text>
            <Text style={TextStyles.body}>
              Precisão: {(position.coords.accuracy ?? 0).toFixed(1)} metros
            </Text>
          </AppCard>
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
          title="Obter localização atual"
          icon="my-location"
          disabled={isLoading}
          onPress={getCurrentPosition}
        />
        {serviceEnabled === false && (
          <AppButton
            variant="text"
            title="Ativar localização do dispositivo"
            icon="location-disabled"
            onPress={openLocationSettings}
          />
        )}
        {isPermanentlyDenied(permission) && (
          <AppButton
            variant="text"
            title="Abrir configurações do aplicativo"
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

const styles = StyleSheet.create({
  position: {
    padding: DS.spaceMd,
    gap: DS.spaceXs,
  },
});

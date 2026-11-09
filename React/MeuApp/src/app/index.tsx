import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppLoading } from '@/components/AppLoading';
import { AppLogo } from '@/components/AppLogo';
import { Colors } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';
import { AppLogger } from '@/core/utils/appLogger';
import type { SessionRestoreResult } from '@/models/auth';
import { authRepository } from '@/repositories/authRepository';
import { useAuthStore } from '@/stores/authStore';

const MINIMUM_SPLASH_MS = 5000;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    (async () => {
      AppLogger.splash(`Splash iniciada. Tempo mínimo: ${MINIMUM_SPLASH_MS / 1000} segundos.`);
      const minimumTime = delay(MINIMUM_SPLASH_MS);

      let result: SessionRestoreResult;

      try {
        AppLogger.splash('Solicitando restauração da sessão.');
        result = await authRepository.restoreSession();
        AppLogger.splash(`Restauração concluída: ${result}.`);
      } catch (error) {
        AppLogger.error('SPLASH', 'Erro não tratado durante a restauração.', error);
        await authRepository.logout();
        result = 'unauthenticated';
      }

      useAuthStore.setState({
        session: authRepository.currentSession,
        isAuthenticated: result === 'authenticated',
      });

      AppLogger.splash('Aguardando o tempo mínimo da Splash.');
      await minimumTime;

      if (!mounted) {
        AppLogger.splash('Splash não está mais montada. Navegação cancelada.');
        return;
      }

      if (result === 'authenticated') {
        AppLogger.splash('Sessão autenticada. Navegando para Home.');
        router.replace('/home');
      } else {
        AppLogger.splash('Sessão não autenticada. Navegando para Login.');
        router.replace('/login');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <AppLogo width={DS.logoWidth} />
      <View style={styles.spacer} />
      <AppLoading />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    height: DS.spaceXXl,
  },
});

import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomNav } from '@/components/AppBottomNav';
import { AppButton } from '@/components/AppButton';
import type { IconName } from '@/components/Icon';
import { Colors, TextStyles } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';
import { HomeHeader } from '@/features/home/HomeHeader';
import { MiniCard } from '@/features/home/MiniCard';
import { QuickActionCard } from '@/features/home/QuickActionCard';
import { useHomeStore } from '@/stores/homeStore';

const QUICK_ACTIONS: { icon: IconName; title: string }[] = [
  { icon: 'medical-services', title: 'Consultas' },
  { icon: 'calendar-month', title: 'Agendamentos' },
  { icon: 'attach-money', title: 'Financeiro' },
  { icon: 'science', title: 'Exames' },
  { icon: 'badge', title: 'Meu Plano' },
  { icon: 'more-horiz', title: 'Outros' },
];

const SERVICES: { icon: IconName; title: string }[] = [
  { icon: 'vaccines', title: 'Vacinas' },
  { icon: 'science', title: 'Laboratório' },
  { icon: 'monitor-heart', title: 'Diagnóstico' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const gridItemWidth = Math.floor((width - DS.spaceLg * 2 - DS.spaceMd * 2) / 3);
  const { isLoading, titular, planoAtivo, errorMessage, sessionExpired, loadHome } = useHomeStore();

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!titular || !planoAtivo) {
    return (
      <View style={[styles.centered, styles.empty]}>
        <Text style={[TextStyles.body, styles.center]}>
          {errorMessage ?? 'Nenhum beneficiário encontrado'}
        </Text>
        {sessionExpired ? (
          <AppButton title="Fazer login" onPress={() => router.replace('/login')} />
        ) : (
          <AppButton title="Tentar novamente" icon="refresh" onPress={loadHome} />
        )}
      </View>
    );
  }

  const primeiroNome = titular.nome.trim().split(/\s+/)[0] ?? '';

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.topInset} />
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <HomeHeader nome={primeiroNome} />
          <View style={styles.headerSpacer} />
          <MiniCard
            nome={titular.nome}
            carteira={planoAtivo.carteira}
            produto={planoAtivo.plano}
            onVerCartao={() => router.push('/cartao')}
          />
        </View>

        <View style={styles.content}>
          <Text style={TextStyles.titleLarge}>O que você precisa?</Text>
          <View style={styles.grid}>
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard
                key={action.title}
                {...action}
                style={[styles.gridItem, { width: gridItemWidth }]}
              />
            ))}
          </View>

          <Text style={[TextStyles.titleLarge, styles.section]}>Pensado para você!</Text>
          <View style={styles.banner}>
            <Text style={TextStyles.actionTitle}>Banner Promocional</Text>
          </View>

          <Text style={[TextStyles.titleLarge, styles.section]}>Serviços Próprios</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.services}>
            {SERVICES.map((service) => (
              <QuickActionCard key={service.title} {...service} style={styles.serviceItem} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
      <AppBottomNav currentItemId="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topInset: {
    backgroundColor: Colors.primary,
  },
  scroll: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  empty: {
    padding: DS.spaceLg,
    gap: DS.spaceMd,
  },
  center: {
    textAlign: 'center',
  },
  header: {
    backgroundColor: Colors.primary,
    padding: DS.spaceLg,
  },
  headerSpacer: {
    height: DS.spaceLg,
  },
  content: {
    padding: DS.spaceLg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DS.spaceMd,
    marginTop: DS.spaceLg,
  },
  gridItem: {
    aspectRatio: DS.homeGridAspectRatio,
  },
  section: {
    marginTop: DS.spaceXl,
    marginBottom: DS.spaceLg,
  },
  banner: {
    height: DS.homeBannerHeight,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: DS.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  services: {
    gap: DS.spaceMd,
    paddingBottom: DS.spaceXl,
  },
  serviceItem: {
    width: DS.homeServiceCardWidth,
    height: DS.homeServicesHeight,
  },
});

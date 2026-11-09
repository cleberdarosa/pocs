import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomNav } from '@/components/AppBottomNav';
import { Icon } from '@/components/Icon';
import { Colors, TextStyles } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';
import { useGoBack } from '@/hooks/useGoBack';
import type { PlanoFamilia } from '@/models/familia';
import { useHomeStore } from '@/stores/homeStore';

const MOCK_COVERAGES = [
  'URGÊNCIA E EMERGÊNCIA',
  'CONSULTAS, EXAMES E PROCEDIMENTOS SIMPLES',
  'EXAMES E PROCEDIMENTOS COMPLEMENTARES',
  'CONSULTAS E/OU SESSÕES MULTIDISCIPLINARES',
  'ENDOSCOPIAS',
  'PROCEDIMENTOS CIRÚRGICOS E INTERNAÇÕES HOSPITALARES *',
  'PROCEDIMENTOS CIRÚRGICOS COMPLEXOS, PROCEDIMENTOS QUIMIOTERÁPICOS, HEMODIÁLISE/DIÁLISE, ÓRTESES E PRÓTESES **',
  'EXAMES DE GENÉTICA E BIOLOGIA MOLECULAR',
  'PARTO A TERMO',
];

const TABS = ['Meus Cartões', 'QR Code/Token'] as const;

const cardEntering = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.96 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
}).duration(300);

function formatCardNumber(value: string) {
  const normalized = value.replace(/\s+/g, '');
  if (!normalized) return '0000 0000 0000 0000';
  return normalized.match(/.{1,4}/g)!.join(' ');
}

export default function CartaoVirtualScreen() {
  const plano = useHomeStore((state) => state.planoAtivo);
  const goBack = useGoBack('/home');
  const [tab, setTab] = useState(0);
  const [showBack, setShowBack] = useState(false);

  if (!plano) return <Redirect href="/home" />;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.appBar}>
          <Pressable
            accessibilityRole="button"
            onPress={goBack}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Icon
              name="arrow-back-ios-new"
              color={Colors.primary}
              size={DS.virtualCardBackIconSize}
            />
            <Text style={TextStyles.virtualCardBack}>Voltar</Text>
          </Pressable>
        </View>

        <View style={styles.pageTitle}>
          <Text style={TextStyles.virtualCardPageTitle} accessibilityRole="header">
            Meus Cartões
          </Text>
        </View>

        <View style={styles.tabBar} accessibilityRole="tablist">
          {TABS.map((label, index) => {
            const selected = tab === index;
            return (
              <Pressable
                key={label}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setTab(index)}
                style={[styles.tab, selected && styles.tabSelected]}>
                <Text
                  style={
                    selected ? TextStyles.virtualCardTabSelected : TextStyles.virtualCardTabUnselected
                  }>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 0 ? (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.cardColumn}>
              {showBack ? (
                <Animated.View key="back" entering={cardEntering}>
                  <CardBack />
                </Animated.View>
              ) : (
                <Animated.View key="front" entering={cardEntering}>
                  <CardFront plano={plano} />
                </Animated.View>
              )}

              <View style={styles.moreInfo}>
                <View style={styles.moreInfoButton}>
                  <Icon
                    name="add"
                    color={Colors.virtualCardInfoIcon}
                    size={DS.virtualCardInfoIconSize}
                  />
                </View>
                <Text style={TextStyles.virtualCardMoreInfo}>Mais informações</Text>
              </View>

              <CardSideSelector showBack={showBack} onToggle={() => setShowBack((v) => !v)} />
            </View>
          </ScrollView>
        ) : (
          <View style={styles.placeholder}>
            <Text style={TextStyles.virtualCardTabPlaceholder}>Tab 2</Text>
          </View>
        )}
      </SafeAreaView>
      <AppBottomNav currentItemId="home" />
    </View>
  );
}

function CardFront({ plano }: { plano: PlanoFamilia }) {
  return (
    <View style={[styles.card, styles.cardClip]}>
      <View style={styles.cardHeader}>
        <Text style={[TextStyles.virtualCardLogo, styles.center]}>Unimed</Text>
        <Text style={[TextStyles.virtualCardUnit, styles.unit]}>Porto Alegre</Text>
        <Text style={[TextStyles.virtualCardPlan, styles.center]} numberOfLines={3}>
          {plano.plano.toUpperCase()}
        </Text>
        <Text style={[TextStyles.virtualCardContract, styles.center, styles.contract]}>
          Coletivo empresarial
        </Text>
      </View>

      <View style={styles.cardDetails}>
        <Text style={TextStyles.virtualCardNumber} numberOfLines={1} adjustsFontSizeToFit>
          {formatCardNumber(plano.carteira)}
        </Text>
        <CardInformation value="CLEBER PADILHA DA ROSA" label="Nome do Beneficiário" />
        <InformationRow
          left={<CardInformation value="COLETIVA" label="Acomodação" />}
          right={<CardInformation value="30/09/2028" label="Validade" />}
        />
        <InformationRow
          left={<CardInformation value="REGULAMENTADO" label="Plano" />}
          right={<CardInformation value="NA04 BÁSICO" label="Rede de Atendimento" />}
        />
        <InformationRow
          left={<CardInformation value="NACIONAL" label="Abrangência" />}
          right={<CardInformation value="0048" label="Atend." />}
        />
        <CardInformation
          value="AMBULATORIAL + HOSPITALAR COM OBSTETRÍCIA"
          label="Segmentação Assistencial do Plano"
        />
        <View style={styles.status}>
          <Icon
            name="verified-user"
            size={DS.virtualCardStatusIconSize}
            color={Colors.virtualCardText}
          />
          <Text style={[TextStyles.virtualCardStatus, styles.flex]}>
            Status da carteira: {plano.statusCarteira}
          </Text>
        </View>
      </View>
    </View>
  );
}

function CardBack() {
  return (
    <View style={[styles.card, styles.cardBack]}>
      <Text>
        <Text style={TextStyles.virtualCardValue}>Área de Atuação do Produto: </Text>
        <Text style={TextStyles.virtualCardLabel}>NACIONAL</Text>
      </Text>

      <View style={styles.coverages}>
        {MOCK_COVERAGES.map((coverage) => (
          <View key={coverage} style={styles.coverageRow}>
            <Text style={[TextStyles.virtualCardLabel, styles.coverageDescription]}>{coverage}</Text>
            <Text style={[TextStyles.virtualCardLabel, styles.coverageStatus]}>PERMITIDO</Text>
          </View>
        ))}
      </View>

      <Text style={TextStyles.virtualCardValue}>
        URGÊNCIA/EMERGÊNCIA EM TODO O TERRITÓRIO NACIONAL.
      </Text>
      <CardInformation value="422273993" label="Cód. Produto ANS" />
      <CardInformation value="708600032958484" label="CNS" />
      <Text style={[TextStyles.virtualCardLabel, styles.center]}>
        Eventuais alterações ocorridas na rede de prestadores poderão ser consultadas no
        www.unimedpoa.com.br e no tel. 4004-2040.
      </Text>
      <View style={styles.sac}>
        <Text style={TextStyles.virtualCardLabel}>SAC/Informações</Text>
        <Text style={TextStyles.virtualCardValue}>0800-510-4646</Text>
        <Text style={[TextStyles.virtualCardLabel, styles.ans]}>ANS - nº 352501</Text>
      </View>
    </View>
  );
}

function CardSideSelector({ showBack, onToggle }: { showBack: boolean; onToggle: () => void }) {
  const travel = DS.virtualCardSwitchWidth - DS.spaceXs * 2 - DS.virtualCardSwitchThumbRadius * 2;
  const offset = useSharedValue(showBack ? travel : 0);

  useEffect(() => {
    offset.value = withTiming(showBack ? travel : 0, { duration: 220 });
  }, [showBack, offset, travel]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: showBack }}
      accessibilityLabel={showBack ? 'Exibindo o verso do cartão' : 'Exibindo a frente do cartão'}
      onPress={onToggle}
      style={styles.selector}>
      <Text style={showBack ? TextStyles.virtualCardBackSide : TextStyles.virtualCardFront}>
        FRENTE
      </Text>
      <View style={styles.switchTrack}>
        <Animated.View style={[styles.switchThumb, thumbStyle]} />
      </View>
      <Text style={showBack ? TextStyles.virtualCardFront : TextStyles.virtualCardBackSide}>
        VERSO
      </Text>
    </Pressable>
  );
}

function CardInformation({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.info}>
      <Text style={TextStyles.virtualCardValue}>{value}</Text>
      <Text style={TextStyles.virtualCardLabel}>{label}</Text>
    </View>
  );
}

function InformationRow({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.flex}>{left}</View>
      <View style={styles.flex}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  pressed: { opacity: 0.6 },
  appBar: {
    height: DS.virtualCardAppBarHeight,
    justifyContent: 'center',
    paddingHorizontal: DS.spaceMd,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: DS.spaceSm,
    paddingHorizontal: DS.spaceXs,
    paddingVertical: DS.spaceSm,
  },
  pageTitle: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: DS.spaceLg,
    paddingVertical: DS.spaceMd,
  },
  tabBar: {
    flexDirection: 'row',
    height: DS.virtualCardTabHeight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: DS.virtualCardTabIndicatorWeight,
    borderBottomColor: 'transparent',
  },
  tabSelected: { borderBottomColor: Colors.primary },
  content: { padding: DS.spaceMd, paddingBottom: DS.spaceLg, alignItems: 'center' },
  cardColumn: { width: '100%', maxWidth: DS.virtualCardMaxWidth, gap: DS.spaceMd },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    borderRadius: DS.radiusXl,
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  },
  cardClip: { overflow: 'hidden' },
  cardHeader: {
    backgroundColor: Colors.virtualCardHeader,
    padding: DS.spaceMd,
    alignItems: 'center',
  },
  unit: { marginTop: DS.spaceXs, marginBottom: DS.spaceMd },
  contract: { marginTop: DS.spaceSm },
  cardDetails: {
    backgroundColor: Colors.virtualCardDetails,
    padding: DS.spaceMd,
    gap: DS.spaceMd,
  },
  info: { gap: DS.spaceXs },
  infoRow: { flexDirection: 'row', gap: DS.spaceMd },
  status: { flexDirection: 'row', alignItems: 'center', gap: DS.spaceSm },
  cardBack: {
    backgroundColor: Colors.white,
    borderWidth: DS.virtualCardBorderWidth,
    borderColor: Colors.border,
    padding: DS.spaceMd,
    gap: DS.spaceLg,
  },
  coverages: { gap: DS.spaceSm },
  coverageRow: { flexDirection: 'row', gap: DS.spaceSm },
  coverageDescription: { flex: 3 },
  coverageStatus: { flex: 1, textAlign: 'right' },
  sac: { alignItems: 'center' },
  ans: { marginTop: DS.spaceXs },
  moreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: DS.spaceSm,
  },
  moreInfoButton: {
    width: DS.virtualCardInfoButtonSize,
    height: DS.virtualCardInfoButtonSize,
    borderRadius: DS.virtualCardInfoButtonSize / 2,
    backgroundColor: Colors.virtualCardInfoBackground,
    borderWidth: DS.virtualCardBorderWidth,
    borderColor: Colors.virtualCardInfoBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spaceSm,
    paddingVertical: DS.spaceSm,
  },
  switchTrack: {
    width: DS.virtualCardSwitchWidth,
    height: DS.virtualCardSwitchHeight,
    padding: DS.spaceXs,
    borderRadius: DS.radiusCircular,
    backgroundColor: Colors.virtualCardSwitch,
    justifyContent: 'center',
  },
  switchThumb: {
    width: DS.virtualCardSwitchThumbRadius * 2,
    height: DS.virtualCardSwitchThumbRadius * 2,
    borderRadius: DS.virtualCardSwitchThumbRadius,
    backgroundColor: Colors.white,
  },
});

import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Icon } from '@/components/Icon';
import { Colors, TextStyles } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';

interface MiniCardProps {
  nome: string;
  carteira: string;
  produto: string;
  onVerCartao: () => void;
}

export function MiniCard({ nome, carteira, produto, onVerCartao }: MiniCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Icon name="favorite" color={Colors.white} />
        <View style={styles.badge}>
          <Text style={TextStyles.cardTag}>{produto}</Text>
        </View>
      </View>

      <Text style={[TextStyles.cardNumber, styles.number]}>{carteira}</Text>
      <Text style={TextStyles.cardName}>{nome}</Text>

      <View style={styles.actions}>
        <AppButton variant="elevated" title="Ver Cartão" onPress={onVerCartao} style={styles.flex} />
        <AppButton variant="elevated" title="Gerar Token" onPress={() => {}} style={styles.flex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: DS.spaceLg,
    backgroundColor: Colors.cardBackground,
    borderRadius: DS.radiusLg,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: Colors.cardBadge,
    borderRadius: DS.radiusLg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexShrink: 1,
    marginLeft: DS.spaceMd,
  },
  number: {
    marginTop: DS.spaceLg,
    marginBottom: DS.spaceSm,
  },
  actions: {
    flexDirection: 'row',
    gap: DS.spaceMd,
    marginTop: DS.spaceLg,
  },
  flex: {
    flex: 1,
    paddingHorizontal: DS.spaceSm,
  },
});

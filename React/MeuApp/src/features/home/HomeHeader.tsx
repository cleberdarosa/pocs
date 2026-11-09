import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Colors, TextStyles } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';

export function HomeHeader({ nome }: { nome: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{nome ? nome[0] : '?'}</Text>
      </View>

      <View style={styles.info}>
        <Text style={TextStyles.headerGreeting}>Olá, {nome}</Text>
        <View style={styles.action}>
          <Text style={TextStyles.headerAction}>Alterar usuário</Text>
        </View>
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="Buscar" hitSlop={8} style={styles.search}>
        <Icon name="search" color={Colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  info: {
    flex: 1,
    marginLeft: DS.spaceMd,
    gap: DS.spaceSm,
    alignItems: 'flex-start',
  },
  action: {
    backgroundColor: Colors.white,
    borderRadius: DS.radiusMd,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  search: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

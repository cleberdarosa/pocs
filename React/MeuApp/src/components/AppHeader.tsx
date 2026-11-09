import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Colors, TextStyles } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
}

/** AppBar verde com título centralizado (tema do app Flutter). */
export function AppHeader({ title, onBack }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={onBack}
            hitSlop={8}
            style={styles.side}>
            <Icon name="arrow-back" color={Colors.white} />
          </Pressable>
        ) : (
          <View style={styles.side} />
        )}
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        <View style={styles.side} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
  },
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DS.spaceSm,
  },
  side: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...TextStyles.appBarTitle,
    flex: 1,
    textAlign: 'center',
  },
});

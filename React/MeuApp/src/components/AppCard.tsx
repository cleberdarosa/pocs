import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';

/** Equivalente ao `Card` do Material. */
export function AppCard({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: DS.radiusMd,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.15)',
  },
});

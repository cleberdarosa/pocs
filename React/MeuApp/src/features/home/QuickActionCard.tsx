import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { Colors, TextStyles } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';

interface QuickActionCardProps {
  icon: IconName;
  title: string;
  style?: StyleProp<ViewStyle>;
}

export function QuickActionCard({ icon, title, style }: QuickActionCardProps) {
  return (
    <View style={[styles.card, style]} accessible accessibilityLabel={title}>
      <Icon name={icon} size={DS.actionIconSize} color={Colors.primary} />
      <Text style={[TextStyles.actionTitle, styles.title]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: DS.quickActionHeight,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: DS.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DS.spaceSm,
  },
  title: {
    textAlign: 'center',
    marginTop: DS.spaceSm,
  },
});

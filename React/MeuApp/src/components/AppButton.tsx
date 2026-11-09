import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { Colors } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';

type Variant = 'filled' | 'outlined' | 'text' | 'elevated';

interface AppButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  /** Cor de fundo (filled) ou de destaque (outlined/text). */
  color?: string;
  textColor?: string;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function AppButton({
  title,
  onPress,
  variant = 'filled',
  icon,
  disabled = false,
  loading = false,
  color = Colors.primary,
  textColor,
  textStyle,
  style,
  accessibilityLabel,
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  const foreground =
    textColor ??
    (variant === 'filled' ? Colors.white : variant === 'elevated' ? Colors.primary : color);

  const containerStyle: ViewStyle =
    variant === 'filled'
      ? { backgroundColor: color }
      : variant === 'outlined'
        ? { borderWidth: 1, borderColor: Colors.textMuted }
        : variant === 'elevated'
          ? { backgroundColor: Colors.submenuBackground, boxShadow: '0px 1px 3px rgba(0,0,0,0.25)' }
          : {};

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'text' && styles.text,
        containerStyle,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={foreground} />
      ) : (
        <View style={styles.content}>
          {icon && <Icon name={icon} size={18} color={foreground} />}
          <Text style={[styles.label, { color: foreground }, textStyle]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 40,
    paddingHorizontal: DS.spaceLg,
    borderRadius: DS.radiusCircular,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    paddingHorizontal: DS.spaceSm + 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spaceSm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});

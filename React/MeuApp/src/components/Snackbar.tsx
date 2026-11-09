import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DS } from '@/core/theme/designSystem';

interface SnackbarProps {
  message: string | null;
  onHide: () => void;
  duration?: number;
}

/** Mensagem temporária no rodapé (equivalente ao SnackBar do Material). */
export function Snackbar({ message, onHide, duration = 4000 }: SnackbarProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onHide, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onHide]);

  if (!message) return null;

  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutDown}
      accessibilityLiveRegion="polite"
      style={[styles.container, { bottom: insets.bottom + DS.spaceMd }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: DS.spaceMd,
    right: DS.spaceMd,
    backgroundColor: '#323232',
    borderRadius: 4,
    paddingHorizontal: DS.spaceMd,
    paddingVertical: 14,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

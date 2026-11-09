import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const WIDTH = 220;
const BAR = WIDTH * 0.4;

/** Barra de progresso indeterminada (LinearProgressIndicator). */
export function AppLoading() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -BAR + progress.value * (WIDTH + BAR) }],
  }));

  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel="Carregando">
      <Animated.View style={[styles.bar, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  bar: {
    width: BAR,
    height: 3,
    backgroundColor: '#FFFFFF',
  },
});

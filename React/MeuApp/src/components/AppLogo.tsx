import { Image } from 'expo-image';

import { DS } from '@/core/theme/designSystem';

const logo = require('@/assets/images/logo.png');

export function AppLogo({ width = DS.logoWidth }: { width?: number }) {
  return (
    <Image
      source={logo}
      style={{ width, aspectRatio: 190 / 70 }}
      contentFit="contain"
      accessibilityLabel="Unimed Porto Alegre"
    />
  );
}

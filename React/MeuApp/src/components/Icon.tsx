import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

type IconProps = Omit<ComponentProps<typeof MaterialIcons>, 'name'> & { name: IconName };

/** Ícones Material (mesmo conjunto usado pelo Flutter). */
export function Icon({ size = 24, ...props }: IconProps) {
  return <MaterialIcons size={size} {...props} />;
}

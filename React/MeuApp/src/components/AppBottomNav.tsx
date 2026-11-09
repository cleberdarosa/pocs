import { useRouter, usePathname, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { Colors, TextStyles } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';
import type { BottomNavItem } from '@/models/bottomNavItem';
import { bottomNavRepository } from '@/repositories/contentRepositories';

const ICONS: Record<string, IconName> = {
  home: 'home',
  home_outlined: 'home',
  science: 'science',
  science_outlined: 'science',
  menu_book: 'menu-book',
  menu_book_outlined: 'menu-book',
  map: 'map',
  map_outlined: 'map',
  person: 'person',
  person_outline: 'person-outline',
  menu: 'menu',
  more_horiz: 'more-horiz',
};

const iconFromName = (name: string): IconName => ICONS[name] ?? 'circle';

const FALLBACK_ITEMS: BottomNavItem[] = [
  { id: 'home', label: 'Início', icon: 'home_outlined', activeIcon: 'home', route: '/home', enabled: true, order: 1 },
  { id: 'exams', label: 'Exames', icon: 'science_outlined', activeIcon: 'science', route: '/home', enabled: true, order: 2 },
  { id: 'medical-guide', label: 'Guia Médico', icon: 'menu_book_outlined', activeIcon: 'menu_book', route: '/home', enabled: true, order: 3 },
  { id: 'profile', label: 'Perfil', icon: 'person_outline', activeIcon: 'person', route: '/home', enabled: true, order: 4 },
  { id: 'menu', label: 'Menu', icon: 'menu', activeIcon: 'menu', route: '/menu', enabled: true, order: 5 },
];

interface AppBottomNavProps {
  currentItemId: string;
  onItemPress?: (item: BottomNavItem) => void;
}

export function AppBottomNav({ currentItemId, onItemPress }: AppBottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<BottomNavItem[] | null>(bottomNavRepository.getCached());

  useEffect(() => {
    let active = true;
    bottomNavRepository
      .getBottomNavigation()
      .then((result) => active && setItems(result.length > 0 ? result : FALLBACK_ITEMS))
      .catch(() => active && setItems(FALLBACK_ITEMS));
    return () => {
      active = false;
    };
  }, []);

  const containerStyle = [styles.container, { paddingBottom: insets.bottom }];

  if (!items) {
    return (
      <View style={[containerStyle, styles.loading]}>
        <ActivityIndicator size="small" color={Colors.bottomNavSelected} />
      </View>
    );
  }

  const foundIndex = items.findIndex((item) => item.id === currentItemId);
  const selectedIndex = foundIndex >= 0 ? foundIndex : 0;

  const handlePress = (item: BottomNavItem) => {
    onItemPress?.(item);
    if (pathname === item.route) return;
    router.replace(item.route as Href);
  };

  return (
    <View style={containerStyle} accessibilityRole="tablist">
      {items.map((item, index) => {
        const selected = index === selectedIndex;
        const color = selected ? Colors.bottomNavSelected : Colors.bottomNavUnselected;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={item.label}
            onPress={() => handlePress(item)}
            style={styles.item}>
            <Icon
              name={iconFromName(selected ? item.activeIcon : item.icon)}
              size={DS.navIconSize}
              color={color}
            />
            <Text style={[TextStyles.bottomNavLabel, { color }]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.bottomNavBackground,
  },
  loading: {
    height: DS.bottomNavHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    flex: 1,
    height: DS.bottomNavHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});

import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Icon, type IconName } from '@/components/Icon';
import { Colors, TextStyles } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';
import { hasChildren, type MenuItem } from '@/models/menuItem';

const ICONS: Record<string, IconName> = {
  menu_book: 'menu-book',
  phone: 'phone',
  medical_services: 'medical-services',
  calendar_month: 'calendar-month',
  monetization_on: 'monetization-on',
  science: 'science',
  badge: 'badge',
  hexagon: 'hexagon',
  favorite_border: 'favorite-border',
  local_hospital: 'local-hospital',
  add_box: 'add-box',
  verified: 'verified',
  settings: 'settings',
  warning: 'warning-amber',
};

const COLORS: Record<string, string> = {
  menuGreen: Colors.menuGreen,
  menuLime: Colors.menuLime,
  menuTerracotta: Colors.menuTerracotta,
  menuLightGreen: Colors.menuLightGreen,
  menuBlue: Colors.menuBlue,
  menuRose: Colors.menuRose,
  menuOrange: Colors.menuOrange,
};

interface RecursiveMenuTileProps {
  item: MenuItem;
  level: number;
  expandedItems: Set<string>;
  onToggle: (id: string) => void;
  onLeafPress: (item: MenuItem) => void;
}

export function RecursiveMenuTile({
  item,
  level,
  expandedItems,
  onToggle,
  onLeafPress,
}: RecursiveMenuTileProps) {
  const expanded = expandedItems.has(item.id);
  const withChildren = hasChildren(item);

  const rotation = useSharedValue(expanded ? 180 : 0);

  useEffect(() => {
    rotation.value = withTiming(expanded ? 180 : 0, { duration: DS.menuAnimationDuration });
  }, [expanded, rotation]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const onPress = withChildren
    ? () => onToggle(item.id)
    : item.enabled
      ? () => onLeafPress(item)
      : undefined;

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={withChildren ? { expanded } : { disabled: !item.enabled }}
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [
          styles.tile,
          {
            minHeight: level === 0 ? DS.menuItemHeight : DS.menuSubItemHeight,
            paddingLeft: level === 0 ? DS.spaceMd : level === 1 ? DS.spaceLg : DS.menuSubItemLeftPadding,
            backgroundColor: level === 0 ? Colors.white : Colors.menuSubmenuBackground,
          },
          pressed && styles.pressed,
        ]}>
        <Leading item={item} level={level} />
        <Text
          style={[styles.title, level === 0 ? TextStyles.menuItemTitle : TextStyles.menuSubItemTitle]}>
          {item.title}
        </Text>
        {withChildren ? (
          <Animated.View style={arrowStyle}>
            <Icon name="keyboard-arrow-down" color={Colors.textPrimary} />
          </Animated.View>
        ) : (
          <Icon name="chevron-right" color={Colors.primary} />
        )}
      </Pressable>

      {expanded && (
        <Animated.View
          entering={FadeIn.duration(DS.menuAnimationDuration)}
          exiting={FadeOut.duration(DS.menuAnimationDuration)}>
          {item.children.map((child) => (
            <RecursiveMenuTile
              key={child.id}
              item={child}
              level={level + 1}
              expandedItems={expandedItems}
              onToggle={onToggle}
              onLeafPress={onLeafPress}
            />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

function Leading({ item, level }: { item: MenuItem; level: number }) {
  if (level === 0) {
    return (
      <Icon
        name={(item.icon && ICONS[item.icon]) || 'chevron-right'}
        color={(item.color && COLORS[item.color]) || Colors.primary}
        size={DS.menuItemIconSize}
      />
    );
  }

  if (level === 1) {
    return <Icon name="subdirectory-arrow-right" color={Colors.primary} size={DS.navIconSize} />;
  }

  return <Icon name="circle" color={Colors.primary} size={DS.spaceSm} />;
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: DS.spaceMd,
    gap: DS.spaceMd,
  },
  title: {
    flex: 1,
    paddingVertical: DS.spaceSm,
  },
  pressed: {
    opacity: 0.7,
  },
});

import { useRouter, type Href } from 'expo-router';
import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomNav } from '@/components/AppBottomNav';
import { AppButton } from '@/components/AppButton';
import { Icon } from '@/components/Icon';
import { Colors, TextStyles } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';
import { RecursiveMenuTile } from '@/features/menu/RecursiveMenuTile';
import { hasChildren, type MenuItem } from '@/models/menuItem';
import { menuRepository } from '@/repositories/contentRepositories';

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

function filterItem(item: MenuItem, query: string): MenuItem | null {
  const matches = normalize(item.title).includes(query);
  const children = item.children
    .map((child) => filterItem(child, query))
    .filter((child): child is MenuItem => child != null);

  if (!matches && children.length === 0) return null;
  return { ...item, children: matches ? item.children : children };
}

function collectParentIds(items: MenuItem[], ids: Set<string>) {
  for (const item of items) {
    if (hasChildren(item)) {
      ids.add(item.id);
      collectParentIds(item.children, ids);
    }
  }
}

export default function MenuScreen() {
  const router = useRouter();
  const searchRef = useRef<ComponentRef<typeof TextInput>>(null);

  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const loadMenu = useCallback(async () => {
    try {
      const result = await menuRepository.getMenu();
      setError(false);
      setItems(result);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    menuRepository
      .getMenu()
      .then(setItems)
      .catch(() => setError(true));
  }, []);

  const trimmedQuery = query.trim();

  const filtered = useMemo(() => {
    if (!items) return [];
    if (!trimmedQuery) return items;
    const normalized = normalize(trimmedQuery);
    return items
      .map((item) => filterItem(item, normalized))
      .filter((item): item is MenuItem => item != null);
  }, [items, trimmedQuery]);

  // Durante a busca, os grupos com resultados ficam sempre expandidos (como no Flutter).
  const visibleExpanded = useMemo(() => {
    if (!trimmedQuery) return expandedItems;
    const ids = new Set(expandedItems);
    collectParentIds(filtered, ids);
    return ids;
  }, [expandedItems, filtered, trimmedQuery]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedItems((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const navigateToItem = useCallback(
    (item: MenuItem) => router.push((item.route ?? '/home') as Href),
    [router],
  );

  const clearSearch = () => {
    setQuery('');
    setExpandedItems(new Set());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMenu();
    setRefreshing(false);
  };

  const renderBody = () => {
    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={[TextStyles.menuEmptyText, styles.center]}>
            Não foi possível carregar o menu.
          </Text>
          <AppButton title="Tentar novamente" color={Colors.secondary} onPress={loadMenu} />
        </View>
      );
    }

    if (!items) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.white} />
        </View>
      );
    }

    if (filtered.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={[TextStyles.menuEmptyText, styles.center]}>Nenhum item encontrado.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />
        }
        renderItem={({ item }) => (
          <View style={styles.rootItem}>
            <RecursiveMenuTile
              item={item}
              level={0}
              expandedItems={visibleExpanded}
              onToggle={toggleExpanded}
              onLeafPress={navigateToItem}
            />
          </View>
        )}
      />
    );
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.avatarOuter}>
            <View style={styles.avatarInner}>
              <Icon name="person" color={Colors.white} size={DS.menuHeaderIconSize} />
            </View>
          </View>

          <View style={styles.headerInfo}>
            <Text style={TextStyles.menuGreeting}>Olá, Cleber</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/home')}
              style={styles.changeUser}>
              <Icon name="swap-horiz" color={Colors.secondary} size={20} />
              <Text style={TextStyles.menuChangeUser}>Alterar usuário</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar"
            onPress={() => searchRef.current?.focus()}
            style={styles.searchButton}>
            <Icon name="search" color={Colors.white} size={DS.menuHeaderIconSize} />
          </Pressable>
        </View>

        <View style={styles.searchWrapper}>
          <View style={[styles.search, focused && styles.searchFocused]}>
            <Icon name="search" color={Colors.textSecondary} />
            <TextInput
              ref={searchRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Faça sua busca"
              placeholderTextColor={Colors.textMuted}
              returnKeyType="search"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={[TextStyles.menuSearchText, styles.searchInput]}
            />
            {query.length > 0 && (
              <Pressable accessibilityLabel="Limpar busca" onPress={clearSearch} hitSlop={8}>
                <Icon name="close" color={Colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.flex}>{renderBody()}</View>
      </SafeAreaView>
      <AppBottomNav currentItemId="menu" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.menuBackground,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DS.spaceLg,
    paddingTop: DS.spaceLg,
    paddingBottom: DS.spaceMd,
  },
  avatarOuter: {
    width: DS.menuAvatarRadius * 2,
    height: DS.menuAvatarRadius * 2,
    borderRadius: DS.menuAvatarRadius,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: DS.menuAvatarInnerRadius * 2,
    height: DS.menuAvatarInnerRadius * 2,
    borderRadius: DS.menuAvatarInnerRadius,
    backgroundColor: Colors.menuBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: DS.spaceMd,
    gap: DS.spaceSm,
    alignItems: 'flex-start',
  },
  changeUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spaceSm,
    backgroundColor: Colors.white,
    borderRadius: DS.radiusSm,
    paddingHorizontal: DS.spaceMd,
    paddingVertical: DS.spaceSm,
  },
  searchButton: {
    width: DS.menuSearchButtonSize,
    height: DS.menuSearchButtonSize,
    borderRadius: DS.menuSearchButtonSize / 2,
    borderWidth: 1,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrapper: {
    paddingHorizontal: DS.spaceMd,
    paddingTop: DS.spaceMd,
    paddingBottom: DS.spaceSm,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spaceSm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.menuDivider,
    borderRadius: DS.radiusSm,
    paddingHorizontal: DS.spaceMd,
    minHeight: 56,
  },
  searchFocused: {
    borderColor: Colors.secondary,
    borderWidth: DS.menuFocusedBorderWidth,
  },
  searchInput: {
    flex: 1,
    paddingVertical: DS.spaceMd,
  },
  list: {
    paddingHorizontal: DS.spaceMd,
    paddingTop: DS.spaceSm,
    paddingBottom: DS.spaceLg,
  },
  rootItem: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.menuDivider,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DS.spaceLg,
    gap: DS.spaceMd,
  },
  center: {
    textAlign: 'center',
  },
});

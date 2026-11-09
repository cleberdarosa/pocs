type Json = Record<string, unknown>;

export interface BottomNavItem {
  id: string;
  label: string;
  icon: string;
  activeIcon: string;
  route: string;
  enabled: boolean;
  order: number;
}

export interface BottomNavigationResponse {
  version: number;
  items: BottomNavItem[];
}

export function parseBottomNavItem(json: Json): BottomNavItem {
  return {
    id: json.id as string,
    label: json.label as string,
    icon: json.icon as string,
    activeIcon: (json.activeIcon as string | undefined) ?? (json.icon as string),
    route: json.route as string,
    enabled: (json.enabled as boolean | undefined) ?? true,
    order: (json.order as number | undefined) ?? 0,
  };
}

export function parseBottomNavigationResponse(json: Json): BottomNavigationResponse {
  const rawItems = Array.isArray(json.items) ? json.items : [];
  return {
    version: (json.version as number | undefined) ?? 1,
    items: rawItems.map((item) => parseBottomNavItem(item as Json)),
  };
}

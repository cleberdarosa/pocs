type Json = Record<string, unknown>;

export interface MenuItem {
  id: string;
  title: string;
  icon?: string;
  color?: string;
  route?: string;
  enabled: boolean;
  children: MenuItem[];
}

export interface MenuResponse {
  version: number;
  items: MenuItem[];
}

export const hasChildren = (item: MenuItem) => item.children.length > 0;

export function parseMenuItem(json: Json): MenuItem {
  const rawChildren = Array.isArray(json.children) ? json.children : [];
  return {
    id: json.id as string,
    title: json.title as string,
    icon: (json.icon as string | undefined) ?? undefined,
    color: (json.color as string | undefined) ?? undefined,
    route: (json.route as string | undefined) ?? undefined,
    enabled: (json.enabled as boolean | undefined) ?? true,
    children: rawChildren.map((child) => parseMenuItem(child as Json)),
  };
}

export function parseMenuResponse(json: Json): MenuResponse {
  const rawItems = Array.isArray(json.items) ? json.items : [];
  return {
    version: (json.version as number | undefined) ?? 1,
    items: rawItems.map((item) => parseMenuItem(item as Json)),
  };
}

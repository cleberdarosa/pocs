import type { TextStyle } from 'react-native';

const palette = {
  primary: '#00995D',
  secondary: '#006B57',
  background: '#F4F4F4',

  white: '#FFFFFF',
  black: '#000000',
  black87: 'rgba(0, 0, 0, 0.87)',

  border: '#E5E7EB',
  textPrimary: '#22252D',
  textSecondary: '#777777',
  textMuted: '#9CA3AF',

  lime: '#D1DF48',
  lightLime: '#A8CF45',
  lightGreen: '#85B965',
  terracotta: '#B66E5A',
  blue: '#4B9EAD',
  rose: '#D47C82',
  orange: '#FFB52E',

  warningBackground: '#FFC62C',
  warningBorder: '#FF8A00',
  warningIcon: '#FF7900',

  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  tertiary: '#3B6470',
  tertiaryContainer: '#BEEAF7',

  shadow: 'rgba(0, 0, 0, 0.1)',
  submenuBackground: '#F6F8F7',
  divider: '#D9DEE2',
} as const;

export const Colors = {
  ...palette,

  cardBackground: palette.secondary,
  cardBadge: palette.lime,

  bottomNavBackground: palette.secondary,
  bottomNavSelected: palette.lime,
  bottomNavUnselected: palette.white,

  virtualCardHeader: palette.primary,
  virtualCardDetails: palette.lime,
  virtualCardText: palette.textPrimary,
  virtualCardMutedText: palette.textSecondary,
  virtualCardSwitch: palette.textSecondary,
  virtualCardInfoBackground: palette.warningBackground,
  virtualCardInfoBorder: palette.warningBorder,
  virtualCardInfoIcon: palette.warningIcon,

  menuBackground: palette.primary,
  menuGreen: palette.primary,
  menuLime: palette.lightLime,
  menuTerracotta: palette.terracotta,
  menuLightGreen: palette.lightGreen,
  menuBlue: palette.blue,
  menuRose: palette.rose,
  menuOrange: palette.orange,
  menuDivider: palette.divider,
  menuSubmenuBackground: palette.submenuBackground,
} as const;

/** Aplica transparência a uma cor hexadecimal (#RRGGBB). */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const text = <T extends Record<string, TextStyle>>(styles: T) => styles;

export const TextStyles = text({
  titleLarge: { color: Colors.textPrimary, fontSize: 28, fontWeight: '700' },
  titleMedium: { color: Colors.textPrimary, fontSize: 24, fontWeight: '700' },
  body: { color: Colors.textPrimary, fontSize: 14 },
  bodySmall: { color: Colors.textSecondary, fontSize: 12 },
  actionTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500' },
  headerGreeting: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  headerAction: { color: Colors.black87, fontSize: 14, fontWeight: '500' },
  cardNumber: { color: Colors.white, fontSize: 28, fontWeight: '700' },
  cardName: { color: Colors.white, fontSize: 18 },
  cardTag: { color: Colors.textPrimary, fontWeight: '700' },
  appBarTitle: { color: Colors.white, fontSize: 20, fontWeight: '500' },

  // Cartão virtual
  virtualCardBack: { color: Colors.virtualCardText, fontSize: 22, fontWeight: '700' },
  virtualCardPageTitle: { color: Colors.white, fontSize: 23, fontWeight: '800' },
  virtualCardTabSelected: { color: Colors.virtualCardText, fontSize: 17, fontWeight: '600' },
  virtualCardTabUnselected: { color: Colors.virtualCardText, fontSize: 17, fontWeight: '400' },
  virtualCardTabPlaceholder: { color: Colors.virtualCardText, fontSize: 22, fontWeight: '600' },
  virtualCardLogo: {
    color: Colors.white,
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 46,
    letterSpacing: -1.5,
  },
  virtualCardUnit: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  virtualCardPlan: { color: Colors.white, fontSize: 15, lineHeight: 19, fontWeight: '800' },
  virtualCardContract: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  virtualCardNumber: {
    color: Colors.virtualCardText,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  virtualCardValue: { color: Colors.black, fontSize: 14, lineHeight: 16, fontWeight: '900' },
  virtualCardLabel: { color: Colors.black, fontSize: 11, lineHeight: 13, fontWeight: '600' },
  virtualCardStatus: { color: Colors.virtualCardText, fontSize: 12, fontWeight: '700' },
  virtualCardMoreInfo: { color: Colors.virtualCardText, fontSize: 15, fontWeight: '800' },
  virtualCardFront: { color: Colors.primary, fontSize: 17, fontWeight: '500' },
  virtualCardBackSide: { color: Colors.virtualCardMutedText, fontSize: 17, fontWeight: '500' },

  // Menu
  menuGreeting: { color: Colors.white, fontSize: 20, fontWeight: '500' },
  menuChangeUser: { color: Colors.secondary, fontSize: 16, fontWeight: '700' },
  menuSearchText: { color: Colors.textPrimary, fontSize: 18 },
  menuItemTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '400' },
  menuSubItemTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '400' },
  menuEmptyText: { color: Colors.white, fontSize: 17, fontWeight: '500' },

  bottomNavLabel: { fontSize: 12, fontWeight: '500' },
});

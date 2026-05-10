import { createTheme } from '@shopify/restyle';
import { LEVEL_COLORS } from './levels';

const palette = {
  primary: '#E0080B',
  secondary: '#016D29',
  tertiary: '#FFFFF0',
  neutral: '#000000',

  black: '#000000',
  white: '#FFFFF0',
};

const theme = createTheme({
  colors: {
    mainBackground: palette.black,
    mainForeground: palette.white,
    cardPrimaryBackground: palette.primary,
    buttonPrimaryBackground: palette.primary,
    buttonPrimaryForeground: palette.white,
    textPrimary: palette.white,
    textSecondary: 'rgba(255,255,255,0.5)',
    linkPrimary: palette.secondary,
    tabBarActive: palette.primary,
    tabBarInactive: '#999999',
    surfaceContainer: '#1B1B1B',
    surfaceContainerHigh: '#2A2A2A',
    surfaceContainerLowest: '#0E0E0E',
    outline: '#767575',
    error: '#FFB4AB',
    errorContainer: 'rgba(224, 8, 11, 0.15)',
    white: '#FFFFFF',
    black: '#000000',
    facebook: '#1877F2',
    levelIron: LEVEL_COLORS.iron,
    levelBronze: LEVEL_COLORS.bronze,
    levelSilver: LEVEL_COLORS.silver,
    levelGold: LEVEL_COLORS.gold,
    levelPlatinum: LEVEL_COLORS.platinum,
    levelEmerald: LEVEL_COLORS.emerald,
    levelRuby: LEVEL_COLORS.ruby,
    levelDiamond: LEVEL_COLORS.diamond,
    levelMaster: LEVEL_COLORS.master,
  },
  spacing: {
    s: 8,
    m: 16,
    l: 24,
    xl: 40,
  },
  breakpoints: {
    phone: 0,
    tablet: 768,
  },
  textVariants: {
    defaults: {
      fontSize: 16,
      color: 'mainForeground',
    },
    header: {
      fontWeight: 'bold',
      fontSize: 34,
    },
    subheader: {
      fontWeight: '600',
      fontSize: 28,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
    },
  },
});

export type Theme = typeof theme;
export default theme;

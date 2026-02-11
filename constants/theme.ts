/**
 * MyCook Theme - Matching the web app design system
 * Palette: Neutrals + Rose accent
 */

import { Platform } from "react-native";

export const Colors = {
  // Neutrals (Tailwind neutral scale)
  neutral: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#E5E5E5",
    300: "#D4D4D4",
    400: "#A3A3A3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
  },

  // Rose (Primary accent)
  rose: {
    50: "#FFF1F2",
    100: "#FFE4E6",
    200: "#FECDD3",
    300: "#FDA4AF",
    400: "#FB7185",
    500: "#F43F5E",
    600: "#E11D48",
    700: "#BE123C",
    800: "#9F1239",
    900: "#881337",
  },

  // Semantic colors
  success: {
    light: "#DCFCE7",
    main: "#22C55E",
    dark: "#15803D",
  },
  error: {
    light: "#FEE2E2",
    main: "#EF4444",
    dark: "#B91C1C",
  },
  info: {
    light: "#DBEAFE",
    main: "#3B82F6",
    dark: "#1D4ED8",
  },

  // Base colors
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",

  // Tab bar colors
  tabIconDefault: "#A3A3A3",
  tabIconSelected: "#F43F5E",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
};

export const FontWeights = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  black: "900" as const,
};

export const Shadows = {
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "System",
    serif: "Georgia",
    rounded: "System",
    mono: "Menlo",
  },
  default: {
    sans: "System",
    serif: "serif",
    rounded: "System",
    mono: "monospace",
  },
});

// Common styles
export const CommonStyles = {
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius["2xl"],
    padding: Spacing.lg,
    ...Shadows.md,
  },
  input: {
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.neutral[900],
  },
};

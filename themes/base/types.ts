import type { ReactNode } from "react";

/**
 * Design tokens shared by all themes (spacing, radius, typography).
 */
export type ThemeTokens = {
  radius: number;
  font: {
    sans: string;
    weight: { normal: number; medium: number; semibold: number; bold: number };
  };
  space: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
};

/**
 * Color palette per theme. Each theme extends with its own keys;
 * base expects at least these for UI components.
 */
export type ThemePalette = {
  primary: string;
  primaryDark: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSoft: string;
  white: string;
  border: string;
  borderFocus: string;
  shadow: string;
  /** Wheel rim (e.g. wood, steel) */
  accent?: string;
  /** Wheel pointer/arrow color (should differ from rim). Falls back to accent. */
  wheelPointerColor?: string;
  /** Success / ready state */
  ready?: string;
  /** Segment colors for wheel (fallback if not in theme) */
  wheelSegmentColors?: string[];
};

/**
 * Stamp component props (used by theme overrides).
 */
export type StampProps = {
  filled: boolean;
};

/**
 * Wheel presentation props (segment labels, colors, rotation, center and pointer).
 */
export type WheelPresentationProps = {
  segmentLabels: string[];
  segmentColors: string[];
  rotation: number;
  spinning: boolean;
  wheelSize: number;
  centerContent: ReactNode;
  pointerElement: ReactNode;
  rimSize: number;
  fontSize: number;
  /** Business name for center (e.g. barber theme). */
  businessName?: string;
};

/**
 * Theme component overrides. Optional per theme.
 */
export type ThemeComponents = {
  Stamp?: (props: StampProps) => ReactNode;
  /** Renders the full wheel UI: rotating segment ring + labels + center + pointer. */
  WheelPresentation?: (props: WheelPresentationProps) => ReactNode;
  /** Custom pointer for the wheel (e.g. scissors image). If not set, default triangle is used. */
  WheelPointer?: (props: { wheelSize: number }) => ReactNode;
  /** Content for the wheel center (e.g. scissors PNG). If not set, empty circle. */
  WheelCenterContent?: (props: { size: number }) => ReactNode;
};

/**
 * Full theme: tokens + palette + optional component overrides.
 */
export type Theme = {
  key: string;
  tokens: ThemeTokens;
  color: ThemePalette;
  components?: ThemeComponents;
};

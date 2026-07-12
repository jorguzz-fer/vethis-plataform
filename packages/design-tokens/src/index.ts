/**
 * @vethis/design-tokens — tokens da marca Vethis como valores TS + CSS vars.
 * Fonte de verdade: VethisDesignSystem. O preset Tailwind vem no M2.
 */

export const colors = {
  green: {
    900: '#02301B',
    800: '#0B3D2A',
    700: '#14523A',
    500: '#3E7D5F',
    50: '#EAF3EE',
  },
  gold: {
    600: '#A8793C',
    500: '#B58D4F',
    400: '#C9A461',
    50: '#F5ECDA',
  },
  ink: '#16201B',
  paper: '#F7F6F2',
  border: '#E2E1D8',
  muted: '#5C665F',
  success: '#2E7D46',
  warning: '#C99A2E',
  error: '#C0392B',
  info: '#2B6CB0',
} as const;

export const fonts = {
  serif: `'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif`,
  sans: `system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
} as const;

export const radius = { sm: 8, md: 12, lg: 18, full: 100 } as const;

/** Escala de espaçamento base 8px. */
export const space = [4, 8, 16, 24, 40, 64] as const;

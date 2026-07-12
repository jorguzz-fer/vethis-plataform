import { colors, fonts, radius } from './tokens';

const stack = (value: string): string[] => value.split(',').map((f) => f.trim());

/**
 * Preset Tailwind da marca Vethis. Usar no `tailwind.config` de cada app:
 *
 *   import { vethisPreset } from '@vethis/design-tokens';
 *   export default { presets: [vethisPreset], content: [...] };
 *
 * Mantém o design system como fonte única — trocar um token reflete em todos os apps.
 */
export const vethisPreset = {
  theme: {
    extend: {
      colors: {
        green: colors.green,
        gold: colors.gold,
        ink: colors.ink,
        paper: colors.paper,
        border: colors.border,
        muted: colors.muted,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        info: colors.info,
      },
      fontFamily: {
        serif: stack(fonts.serif),
        sans: stack(fonts.sans),
      },
      borderRadius: {
        sm: `${radius.sm}px`,
        md: `${radius.md}px`,
        lg: `${radius.lg}px`,
        full: `${radius.full}px`,
      },
    },
  },
};

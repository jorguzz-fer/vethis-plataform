import type { Config } from 'tailwindcss';
import { vethisPreset } from '@vethis/design-tokens';

const config: Config = {
  presets: [vethisPreset as unknown as Partial<Config>],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    // Componentes do design system (classes usadas nas telas).
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};

export default config;

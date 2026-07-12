import type { Config } from 'tailwindcss';
import { vethisPreset } from '@vethis/design-tokens';

const config: Config = {
  presets: [vethisPreset as unknown as Partial<Config>],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};

export default config;

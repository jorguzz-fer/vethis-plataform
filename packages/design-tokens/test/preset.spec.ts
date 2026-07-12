import { describe, expect, it } from 'vitest';
import { colors, vethisPreset } from '../src/index';

describe('vethisPreset', () => {
  it('mapeia as cores da marca no tema Tailwind', () => {
    expect(vethisPreset.theme.extend.colors.green[700]).toBe(colors.green[700]);
    expect(vethisPreset.theme.extend.colors.gold[500]).toBe(colors.gold[500]);
  });

  it('expõe as famílias tipográficas como arrays', () => {
    expect(Array.isArray(vethisPreset.theme.extend.fontFamily.serif)).toBe(true);
    expect(vethisPreset.theme.extend.fontFamily.sans.length).toBeGreaterThan(1);
  });
});

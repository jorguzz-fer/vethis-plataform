import { describe, expect, it } from 'vitest';
import { buttonClasses } from '../src/button';
import { cn } from '../src/cn';

describe('cn', () => {
  it('ignora valores falsy e junta classes', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b');
  });
});

describe('buttonClasses', () => {
  it('aplica a variante primária por padrão', () => {
    const c = buttonClasses();
    expect(c).toContain('bg-green-700');
    expect(c).toContain('rounded-[10px]');
  });

  it('aplica a variante dourada e tamanho pequeno', () => {
    const c = buttonClasses('gold', 'sm');
    expect(c).toContain('bg-gold-500');
    expect(c).toContain('text-sm');
  });
});

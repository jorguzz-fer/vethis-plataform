import { describe, expect, it } from 'vitest';
import {
  creativeReviewKeySchema,
  creativeReviewSchema,
  setCreativeReviewSchema,
} from '../src/creatives/dto';

describe('creatives dto', () => {
  it('aceita chaves de peça da página', () => {
    for (const key of ['clinica-01', 'mielo-10', 'cintia-a']) {
      expect(creativeReviewKeySchema.safeParse(key).success).toBe(true);
    }
  });

  it('rejeita chaves fora do padrão', () => {
    for (const key of ['', 'a', 'Clinica-01', 'clinica_01', 'x/y', 'x'.repeat(41)]) {
      expect(creativeReviewKeySchema.safeParse(key).success).toBe(false);
    }
  });

  it('aprova sem comentário e apara o texto', () => {
    const r = setCreativeReviewSchema.parse({ status: 'aprovado', reviewer: '  Ana ' });
    expect(r).toEqual({ status: 'aprovado', comment: '', reviewer: 'Ana' });
  });

  it('exige comentário para pedir ajustes', () => {
    expect(setCreativeReviewSchema.safeParse({ status: 'ajustes', comment: '  ' }).success).toBe(
      false,
    );
    expect(
      setCreativeReviewSchema.safeParse({ status: 'ajustes', comment: 'Trocar a foto' }).success,
    ).toBe(true);
  });

  it('rejeita status desconhecido e textos longos', () => {
    expect(setCreativeReviewSchema.safeParse({ status: 'ok' }).success).toBe(false);
    expect(
      setCreativeReviewSchema.safeParse({ status: 'aprovado', comment: 'x'.repeat(2001) }).success,
    ).toBe(false);
    expect(
      setCreativeReviewSchema.safeParse({ status: 'aprovado', reviewer: 'x'.repeat(61) }).success,
    ).toBe(false);
  });

  it('serializa a avaliação com data ISO', () => {
    expect(
      creativeReviewSchema.safeParse({
        key: 'clinica-01',
        status: 'ajustes',
        comment: 'Trocar a foto',
        reviewer: null,
        updatedAt: '2026-11-08T12:00:00.000Z',
      }).success,
    ).toBe(true);
  });
});

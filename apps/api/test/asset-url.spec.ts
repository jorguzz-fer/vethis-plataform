import { describe, expect, it } from 'vitest';
import { resolveAssetUrl } from '../src/common/asset-url';

const APP = 'https://vethis.com.br';

describe('resolveAssetUrl', () => {
  it('retorna null para vazio', () => {
    expect(resolveAssetUrl(APP, null)).toBeNull();
    expect(resolveAssetUrl(APP, undefined)).toBeNull();
    expect(resolveAssetUrl(APP, '')).toBeNull();
  });

  it('prefixa caminho relativo', () => {
    expect(resolveAssetUrl(APP, '/cursos/x.png')).toBe('https://vethis.com.br/cursos/x.png');
  });

  it('troca host local por APP_URL (corrige dados semeados antes do APP_URL)', () => {
    expect(resolveAssetUrl(APP, 'http://localhost:3000/cursos/x.png')).toBe(
      'https://vethis.com.br/cursos/x.png',
    );
    expect(resolveAssetUrl(APP, 'http://127.0.0.1:3333/instrutores/y.png')).toBe(
      'https://vethis.com.br/instrutores/y.png',
    );
  });

  it('mantém URL absoluta de host externo (ex.: CDN)', () => {
    expect(resolveAssetUrl(APP, 'https://cdn.exemplo.com/x.png')).toBe(
      'https://cdn.exemplo.com/x.png',
    );
  });

  it('não duplica barra quando APP_URL termina em /', () => {
    expect(resolveAssetUrl('https://vethis.com.br/', '/cursos/x.png')).toBe(
      'https://vethis.com.br/cursos/x.png',
    );
  });

  it('trata caminho sem barra inicial como relativo', () => {
    expect(resolveAssetUrl(APP, 'cursos/x.png')).toBe('https://vethis.com.br/cursos/x.png');
  });
});

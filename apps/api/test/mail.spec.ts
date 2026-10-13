import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/configuration';
import {
  orderCreatedMail,
  paymentConfirmedMail,
  salesNoticeMail,
  welcomeMail,
} from '../src/mail/templates';

const baseEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://vethis:vethis@localhost:5432/vethis',
  SESSION_SECRET: 'a-very-long-session-secret',
} as NodeJS.ProcessEnv;

describe('loadConfig — e-mail', () => {
  it('usa o transporte log por padrão', () => {
    expect(loadConfig(baseEnv).MAIL_PROVIDER).toBe('log');
  });
  it('brevo exige chave e remetente', () => {
    expect(() => loadConfig({ ...baseEnv, MAIL_PROVIDER: 'brevo' })).toThrow(/BREVO_API_KEY/);
    expect(() => loadConfig({ ...baseEnv, MAIL_PROVIDER: 'brevo', BREVO_API_KEY: 'k' })).toThrow(
      /MAIL_FROM/,
    );
    const cfg = loadConfig({
      ...baseEnv,
      MAIL_PROVIDER: 'brevo',
      BREVO_API_KEY: 'k',
      MAIL_FROM: 'nao-responda@vethis.com.br',
    });
    expect(cfg.MAIL_FROM_NAME).toBe('Vethis');
  });
});

describe('templates de e-mail', () => {
  const alunoUrl = 'https://app.vethis.com.br';

  it('bem-vindo usa o primeiro nome e o link da área do aluno', () => {
    const m = welcomeMail({ name: 'Maria Silva', alunoUrl });
    expect(m.html).toContain('Maria, sua conta');
    expect(m.html).toContain(alunoUrl);
    expect(m.text).toContain(alunoUrl);
  });

  it('pedido Pix traz o código copia-e-cola e o total', () => {
    const m = orderCreatedMail({
      name: null,
      courseTitle: 'Pós em Nefrologia',
      method: 'pix',
      amountCents: 826500,
      installments: 1,
      pixCopyPaste: '00020126BR.GOV.BCB.PIX',
      alunoUrl,
    });
    expect(m.subject).toContain('Pós em Nefrologia');
    expect(m.html).toContain('00020126BR.GOV.BCB.PIX');
    expect(m.html).toContain('8.265,00');
  });

  it('pedido boleto parcelado traz o link e as parcelas', () => {
    const m = orderCreatedMail({
      name: 'João',
      courseTitle: 'Curso X',
      method: 'boleto',
      amountCents: 1384800,
      installments: 24,
      boletoUrl: 'https://asaas.com/b/123',
      alunoUrl,
    });
    expect(m.html).toContain('https://asaas.com/b/123');
    expect(m.html).toContain('24x no boleto');
  });

  it('confirmação e aviso interno escapam HTML e trazem valor', () => {
    const m = paymentConfirmedMail({
      name: 'Ana <b>',
      courseTitle: 'Curso <script>',
      method: 'card',
      amountCents: 3064800,
      installments: 24,
      alunoUrl,
    });
    expect(m.html).not.toContain('<script>');
    expect(m.html).toContain('&lt;script&gt;');
    expect(m.html).toContain('30.648,00');
    const n = salesNoticeMail({
      buyerName: null,
      buyerEmail: 'a@b.c',
      courseTitle: 'Curso X',
      method: 'pix',
      amountCents: 950,
      installments: 1,
      orderId: 'ord-1',
    });
    expect(n.subject).toContain('9,50');
    expect(n.text).toContain('a@b.c');
  });
});

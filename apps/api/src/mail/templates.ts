/**
 * Templates dos e-mails transacionais. Funções puras (testáveis) que devolvem
 * assunto + HTML + texto. Visual simples e compatível com clientes de e-mail:
 * tabela centralizada, cores da marca, sem CSS externo.
 */

export type MailBody = { subject: string; html: string; text: string };

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const brl = (cents: number): string => BRL.format(cents / 100);

const METHOD_LABEL: Record<string, string> = {
  pix: 'Pix',
  card: 'cartão de crédito',
  boleto: 'boleto',
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#F4F6F3;font-family:Arial,Helvetica,sans-serif;color:#1C2B24">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="background:#0B3D2A;padding:20px 28px;color:#EAF0EC;font-size:20px;font-weight:bold">Vethis</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:22px;color:#0B3D2A">${esc(title)}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding:16px 28px;background:#F4F6F3;color:#6B7A72;font-size:12px">Vethis · Educação Médica Veterinária. Dúvidas? Responda este e-mail.</td></tr>
</table></td></tr></table></body></html>`;
}

const p = (s: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.5">${s}</p>`;
const button = (href: string, label: string) =>
  `<p style="margin:22px 0"><a href="${href}" style="display:inline-block;background:#B58D4F;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold">${esc(label)}</a></p>`;
const first = (name: string | null | undefined) =>
  name?.trim() ? esc(name.trim().split(/\s+/)[0]!) : 'Olá';

export function welcomeMail(i: { name: string | null; alunoUrl: string }): MailBody {
  const hi = first(i.name);
  return {
    subject: 'Bem-vindo(a) à Vethis',
    html: layout(
      `${hi}, sua conta está pronta`,
      p(
        'Você criou sua conta na Vethis. É com este e-mail e a senha escolhida que você acessa a área do aluno: cursos, aulas, progresso e certificados.',
      ) + button(i.alunoUrl, 'Acessar a área do aluno'),
    ),
    text: `${hi}, sua conta na Vethis está pronta. Acesse a área do aluno: ${i.alunoUrl}`,
  };
}

export function orderCreatedMail(i: {
  name: string | null;
  courseTitle: string;
  method: string;
  amountCents: number;
  installments: number;
  pixCopyPaste?: string | null;
  boletoUrl?: string | null;
  alunoUrl: string;
}): MailBody {
  const hi = first(i.name);
  const how =
    i.installments > 1
      ? `${i.installments}x no ${METHOD_LABEL[i.method] ?? i.method} (total ${brl(i.amountCents)})`
      : `${brl(i.amountCents)} no ${METHOD_LABEL[i.method] ?? i.method}`;
  let action = '';
  if (i.method === 'pix' && i.pixCopyPaste) {
    action =
      p(
        'Pague com o código Pix copia-e-cola abaixo. A matrícula é liberada assim que o pagamento cair.',
      ) +
      `<p style="margin:0 0 14px;padding:12px;background:#F4F6F3;border-radius:8px;font-family:monospace;font-size:12px;word-break:break-all">${esc(i.pixCopyPaste)}</p>`;
  } else if (i.method === 'boleto' && i.boletoUrl) {
    action =
      p('Seu boleto está pronto. A matrícula é liberada após a compensação (1–2 dias úteis).') +
      button(i.boletoUrl, 'Abrir boleto');
  } else {
    action = p('Assim que o pagamento for confirmado, avisamos por e-mail e liberamos o acesso.');
  }
  return {
    subject: `Seu pedido: ${i.courseTitle}`,
    html: layout(
      `${hi}, recebemos seu pedido`,
      p(`Curso: <strong>${esc(i.courseTitle)}</strong><br>Pagamento: ${esc(how)}`) +
        action +
        p(
          `Você acompanha o pedido na <a href="${i.alunoUrl}" style="color:#0B3D2A">área do aluno</a>.`,
        ),
    ),
    text: `${hi}, recebemos seu pedido do curso ${i.courseTitle} (${how}).${
      i.pixCopyPaste ? ` Código Pix: ${i.pixCopyPaste}` : ''
    }${i.boletoUrl ? ` Boleto: ${i.boletoUrl}` : ''} Área do aluno: ${i.alunoUrl}`,
  };
}

export function paymentConfirmedMail(i: {
  name: string | null;
  courseTitle: string;
  method: string;
  amountCents: number;
  installments: number;
  alunoUrl: string;
}): MailBody {
  const hi = first(i.name);
  const how =
    i.installments > 1
      ? `${i.installments}x no ${METHOD_LABEL[i.method] ?? i.method}`
      : (METHOD_LABEL[i.method] ?? i.method);
  return {
    subject: `Matrícula confirmada: ${i.courseTitle}`,
    html: layout(
      `${hi}, sua matrícula está liberada`,
      p(`Pagamento confirmado e acesso liberado ao curso <strong>${esc(i.courseTitle)}</strong>.`) +
        p(`Valor: ${brl(i.amountCents)} · ${esc(how)}`) +
        button(i.alunoUrl, 'Começar a assistir') +
        p('Entre com o mesmo e-mail e senha da compra. Bons estudos!'),
    ),
    text: `${hi}, pagamento confirmado e matrícula liberada no curso ${i.courseTitle} (${brl(i.amountCents)}, ${how}). Acesse: ${i.alunoUrl}`,
  };
}

export function salesNoticeMail(i: {
  buyerName: string | null;
  buyerEmail: string;
  courseTitle: string;
  method: string;
  amountCents: number;
  installments: number;
  orderId: string;
}): MailBody {
  const how =
    i.installments > 1
      ? `${i.installments}x no ${METHOD_LABEL[i.method] ?? i.method}`
      : (METHOD_LABEL[i.method] ?? i.method);
  const line = `${i.buyerName ?? '(sem nome)'} <${i.buyerEmail}> · ${i.courseTitle} · ${brl(i.amountCents)} · ${how}`;
  return {
    subject: `Venda confirmada: ${i.courseTitle} — ${brl(i.amountCents)}`,
    html: layout(
      'Nova venda confirmada',
      p(
        `<strong>Aluno:</strong> ${esc(i.buyerName ?? '(sem nome)')} &lt;${esc(i.buyerEmail)}&gt;`,
      ) +
        p(`<strong>Curso:</strong> ${esc(i.courseTitle)}`) +
        p(`<strong>Valor:</strong> ${brl(i.amountCents)} · ${esc(how)}`) +
        p(`<span style="color:#6B7A72;font-size:12px">Pedido ${esc(i.orderId)}</span>`),
    ),
    text: `Nova venda confirmada: ${line} (pedido ${i.orderId})`,
  };
}

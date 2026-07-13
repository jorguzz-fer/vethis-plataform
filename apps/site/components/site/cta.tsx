import Link from 'next/link';

export function Cta() {
  return (
    <section className="cta" id="cta">
      <div className="wrap cta-in">
        <h2>Comece sua próxima especialização hoje</h2>
        <p>
          Teste gratuitamente por 7 dias. Sem cartão, sem compromisso — só conhecimento clínico de
          verdade.
        </p>
        <div className="row">
          <Link
            href="/cursos"
            className="btn btn-gold"
            style={{ padding: '14px 26px', fontSize: 16 }}
          >
            Criar conta grátis
          </Link>
          <Link
            href="/#clinicas"
            className="btn btn-ghost"
            style={{
              padding: '14px 26px',
              fontSize: 16,
              color: '#EAF1EC',
              borderColor: 'rgba(255,255,255,.28)',
            }}
          >
            Falar com a equipe
          </Link>
        </div>
        <p className="fine">Já formamos mais de 15.000 veterinários em todo o Brasil.</p>
      </div>
    </section>
  );
}

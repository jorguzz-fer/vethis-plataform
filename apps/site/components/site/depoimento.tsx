export function Depoimento() {
  return (
    <section
      className="blk"
      style={{ background: 'var(--paper-2)', borderBlock: '1px solid var(--line-2)' }}
    >
      <div className="wrap">
        <div className="quote">
          <svg
            viewBox="0 0 24 24"
            width="40"
            height="40"
            fill="var(--gold)"
            style={{ margin: '0 auto 18px', opacity: 0.7 }}
          >
            <path d="M7 7H4a1 1 0 00-1 1v6a1 1 0 001 1h4a1 1 0 001-1v-1c0 2-1 3-3 3v2c3 0 5-2 5-5V8a1 1 0 00-1-1zm10 0h-3a1 1 0 00-1 1v6a1 1 0 001 1h4a1 1 0 001-1v-1c0 2-1 3-3 3v2c3 0 5-2 5-5V8a1 1 0 00-1-1z" />
          </svg>
          <p className="qm">
            “A Vethis mudou a rotina de estudo da minha equipe. Consigo <b>matricular todo mundo</b>
            , acompanhar as horas e ainda revisar os casos entre atendimentos.”
          </p>
          <div className="qa">
            <div className="av">J</div>
            <div className="nm">
              <b>Juliana Rocha</b>
              <span>Diretora clínica · VetSaúde</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

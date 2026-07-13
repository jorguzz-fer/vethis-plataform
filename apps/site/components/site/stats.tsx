export function Stats() {
  return (
    <section className="stats">
      <div className="wrap stats-in">
        <div className="stat">
          <b className="num">
            120<span style={{ fontSize: 24 }}>+</span>
          </b>
          <span className="lb">Cursos e trilhas clínicas</span>
        </div>
        <div className="stat">
          <b className="num">
            15.400<span style={{ fontSize: 24 }}>+</span>
          </b>
          <span className="lb">Veterinários em formação</span>
        </div>
        <div className="stat">
          <b className="num">9</b>
          <span className="lb">Especialidades cobertas</span>
        </div>
        <div className="stat">
          <b className="num">
            4,9<span style={{ fontSize: 22, color: 'var(--gold)' }}>★</span>
          </b>
          <span className="lb">Avaliação média dos alunos</span>
        </div>
      </div>
    </section>
  );
}

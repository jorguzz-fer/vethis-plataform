'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Hero } from './hero';

/** Área clicável sobreposta a um botão já desenhado na imagem do slide. */
interface Hotspot {
  label: string;
  href: string;
  /** Posição/tamanho em % da imagem — como a imagem mantém proporção, alinha em qualquer largura. */
  left: string;
  top: string;
  width: string;
  height: string;
}

interface ImageSlide {
  kind: 'image';
  src: string;
  alt: string;
  hotspots: Hotspot[];
}

interface NodeSlide {
  kind: 'node';
  alt: string;
  render: () => React.ReactNode;
}

type Slide = ImageSlide | NodeSlide;

const FELINOS = '/cursos/pos-clinica-medica-felinos';

const SLIDES: Slide[] = [
  {
    kind: 'image',
    src: '/cursos/hero-1-clinica-felinos.png',
    alt: 'Pós-graduação em Clínica Médica de Felinos, com a Dra. Patrícia Bastos. Reconhecido pelo MEC · Rede de Ensino Doctum.',
    hotspots: [
      {
        label: 'Garantir minha vaga',
        href: FELINOS,
        left: '4.8%',
        top: '71%',
        width: '11.6%',
        height: '7.6%',
      },
      {
        label: 'Ver a grade curricular',
        href: `${FELINOS}#disciplinas`,
        left: '16.6%',
        top: '71%',
        width: '12.4%',
        height: '7.6%',
      },
    ],
  },
  {
    kind: 'image',
    src: '/cursos/hero-2-mec-doctum.png',
    alt: 'Pós-graduação reconhecida pelo MEC, emitida pela Rede de Ensino Doctum. 360h · 100% online · 30+ anos de rede Doctum.',
    hotspots: [
      {
        label: 'Conhecer as pós-graduações',
        href: '/cursos',
        left: '42.4%',
        top: '85%',
        width: '15.4%',
        height: '8.4%',
      },
    ],
  },
  { kind: 'node', alt: 'Formação contínua para veterinários', render: () => <Hero /> },
];

const AUTOPLAY_MS = 6000;

export function HeroCarousel() {
  const count = SLIDES.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((i: number) => setActive(((i % count) + count) % count), [count]);
  const next = useCallback(() => go(active + 1), [active, go]);
  const prev = useCallback(() => go(active - 1), [active, go]);

  // Autoplay: pausa no hover/foco e respeita quem prefere menos movimento.
  useEffect(() => {
    if (paused) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const id = window.setInterval(() => setActive((a) => (a + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, count]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    touchX.current = null;
  };

  return (
    <section
      className="hero-carousel"
      aria-roledescription="carrossel"
      aria-label="Destaques Vethis"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      }}
    >
      <div className="hc-viewport">
        {SLIDES.map((slide, i) => {
          const isActive = i === active;
          return (
            <div
              key={i}
              className={`hc-slide${isActive ? ' is-active' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${count}: ${slide.alt}`}
              aria-hidden={!isActive}
              inert={!isActive ? true : undefined}
            >
              {slide.kind === 'image' ? (
                <div className="hc-image-slide">
                  <img className="hc-image" src={slide.src} alt={slide.alt} />
                  {slide.hotspots.map((h) => (
                    <Link
                      key={h.label}
                      href={h.href}
                      className="hc-hotspot"
                      aria-label={h.label}
                      style={
                        {
                          left: h.left,
                          top: h.top,
                          width: h.width,
                          height: h.height,
                        } as CSSProperties
                      }
                    >
                      <span className="sr-only">{h.label}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                slide.render()
              )}
            </div>
          );
        })}
      </div>

      <button type="button" className="hc-arrow hc-prev" onClick={prev} aria-label="Slide anterior">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
      <button type="button" className="hc-arrow hc-next" onClick={next} aria-label="Próximo slide">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <div className="hc-dots" role="tablist" aria-label="Selecionar slide">
        {SLIDES.map((slide, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Ir para o slide ${i + 1}`}
            className={`hc-dot${i === active ? ' is-active' : ''}`}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </section>
  );
}

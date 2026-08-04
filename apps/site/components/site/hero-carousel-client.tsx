'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Hero } from './hero';

/** Botão clicável sobreposto a um botão desenhado na imagem do slide. */
export interface CarouselHotspot {
  label: string;
  href: string;
  left: string;
  top: string;
  width: string;
  height: string;
}

/** Slide em imagem (gerenciado no admin ou padrão embutido). */
export interface CarouselImageSlide {
  src: string;
  alt: string;
  hotspots: CarouselHotspot[];
}

const AUTOPLAY_MS = 6000;

function ImageSlide({ slide }: { slide: CarouselImageSlide }) {
  return (
    <div className="hc-image-slide">
      <img className="hc-image" src={slide.src} alt={slide.alt} />
      {slide.hotspots.map((h) => (
        <Link
          key={h.label}
          href={h.href}
          className="hc-hotspot"
          aria-label={h.label}
          style={{ left: h.left, top: h.top, width: h.width, height: h.height } as CSSProperties}
        >
          <span className="sr-only">{h.label}</span>
        </Link>
      ))}
    </div>
  );
}

/**
 * Carrossel do Hero: slides de imagem (com botões reais sobrepostos) seguidos
 * do mock do app (componente Hero) como último slide fixo. Autoplay com pausa
 * no hover/foco, setas, bolinhas, swipe e respeito a prefers-reduced-motion.
 */
export function HeroCarouselClient({ imageSlides }: { imageSlides: CarouselImageSlide[] }) {
  const slides: Array<{ alt: string; content: ReactNode }> = [
    ...imageSlides.map((s) => ({ alt: s.alt, content: <ImageSlide slide={s} /> })),
    { alt: 'Formação contínua para veterinários', content: <Hero /> },
  ];
  const count = slides.length;

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((i: number) => setActive(((i % count) + count) % count), [count]);
  const next = useCallback(() => go(active + 1), [active, go]);
  const prev = useCallback(() => go(active - 1), [active, go]);

  // Autoplay: pausa no hover/foco e respeita quem prefere menos movimento.
  useEffect(() => {
    if (paused || count <= 1) return;
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
        {slides.map((slide, i) => {
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
              {slide.content}
            </div>
          );
        })}
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            className="hc-arrow hc-prev"
            onClick={prev}
            aria-label="Slide anterior"
          >
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
          <button
            type="button"
            className="hc-arrow hc-next"
            onClick={next}
            aria-label="Próximo slide"
          >
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
            {slides.map((_, i) => (
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
        </>
      ) : null}
    </section>
  );
}

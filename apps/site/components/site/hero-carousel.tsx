import { getHeroSlides } from '@/lib/api';
import { HeroCarouselClient, type CarouselImageSlide } from './hero-carousel-client';

/**
 * Slides padrão embutidos — usados quando o admin ainda não cadastrou nenhum
 * slide (ou a API está indisponível). Assim o carrossel nunca fica vazio.
 * Só slides institucionais: um slide de curso aqui quebraria (404) quando o
 * curso fosse despublicado.
 */
const DEFAULT_SLIDES: CarouselImageSlide[] = [
  {
    src: '/cursos/hero-2-mec-doctum.png',
    alt: 'Pós-graduação reconhecida pelo MEC, emitida pela Rede de Ensino Doctum. 360h · 100% online · 30+ anos de rede Doctum.',
    hotspots: [
      {
        label: 'Conhecer as pós-graduações',
        href: '/cursos',
        left: '42.6%',
        top: '85.8%',
        width: '14.9%',
        height: '7.2%',
      },
    ],
  },
];

/** Server component: busca os slides do admin; cai para os padrão se vazio. */
export async function HeroCarousel() {
  const slides = await getHeroSlides();
  const imageSlides: CarouselImageSlide[] = slides.length
    ? slides.map((s) => ({ src: s.imageUrl, alt: s.alt, hotspots: s.hotspots }))
    : DEFAULT_SLIDES;

  return <HeroCarouselClient imageSlides={imageSlides} />;
}

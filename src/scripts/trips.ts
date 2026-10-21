import './lightbox';
import type { Globe } from './globe';

type Trip = {
  slug: string;
  name: string;
  code: string;
  lat: number;
  lon: number;
  coords: string;
};

const dataEl = document.getElementById('trips-data');
const canvas = document.querySelector<HTMLCanvasElement>('#globe');
const trips: Trip[] = JSON.parse(dataEl?.textContent ?? '[]');

const buttons = [...document.querySelectorAll<HTMLButtonElement>('.trip-btn')];
const panels = [...document.querySelectorAll<HTMLElement>('.trip')];
const coordsEl = document.querySelector<HTMLElement>('[data-coords]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

let active = Math.max(
  0,
  buttons.findIndex((b) => b.getAttribute('aria-pressed') === 'true'),
);
let globe: Globe | null = null;

// Le HTML est rendu pour le voyage le plus récent ; l'éventuel ?v= est appliqué par le script inline.
if (coordsEl && trips[active]) coordsEl.textContent = trips[active].coords;
buttons[active]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });

function setActive(index: number, { updateUrl = true } = {}) {
  active = index;
  const slug = trips[index].slug;
  buttons.forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.slug === slug));
  });
  for (const p of panels) p.hidden = p.dataset.slug !== slug;
  if (coordsEl) coordsEl.textContent = trips[index].coords;
  buttons[index]?.scrollIntoView({
    block: 'nearest',
    inline: 'center',
    behavior: reducedMotion.matches ? 'auto' : 'smooth',
  });
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set('v', slug);
    history.replaceState(null, '', url);
  }
  globe?.setActive(index);
}

function select(index: number) {
  setActive(index);
  globe?.rotateTo(index);
}

buttons.forEach((b, i) => {
  b.addEventListener('click', () => select(i));
});

if (canvas && trips.length) {
  const fromUrl = new URLSearchParams(location.search).get('v');
  const focus = trips.findIndex((t) => t.slug === fromUrl);
  // Équivalent de client:visible : d3 et la carte ne sont chargés qu'à l'arrivée du globe à l'écran.
  const observer = new IntersectionObserver(async (entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    observer.disconnect();
    const { createGlobe } = await import('./globe');
    globe = await createGlobe({
      canvas,
      trips,
      active,
      focus: focus >= 0 ? focus : undefined,
      onSelect: select,
    });
  });
  observer.observe(canvas);
}

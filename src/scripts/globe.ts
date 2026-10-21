import { easeCubicInOut } from 'd3-ease';
import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import { interpolateArray } from 'd3-interpolate';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';

export type GlobeTrip = {
  name: string;
  code: string;
  lat: number;
  lon: number;
};
type Rotation = [number, number, number];

export interface GlobeOptions {
  canvas: HTMLCanvasElement;
  trips: GlobeTrip[];
  active: number;
  /** Trip to face immediately (no animation) instead of the default Europe view. */
  focus?: number;
  onSelect: (index: number) => void;
}

export interface Globe {
  setActive: (index: number) => void;
  rotateTo: (index: number) => void;
}

const INITIAL_ROTATION: Rotation = [-14.4, -38, 0];
const AUTO_ROTATE_DEG_PER_FRAME = 0.07;
const ANIM_MS = 1000;
const TAP_SLOP = 4;
const HIT_RADIUS = 24;
const RESUME_DELAY_MS = 3000;
const ZOOM_MIN = 1;
const ZOOM_MAX = 8;

const LAYOUTS = {
  desktop: {
    k: 0.4,
    dy: 0,
    font: 11,
    label: (t: GlobeTrip) => t.name.toUpperCase(),
  },
  mobile: { k: 0.45, dy: 14, font: 10, label: (t: GlobeTrip) => t.code },
};

export async function createGlobe(opts: GlobeOptions): Promise<Globe> {
  const { canvas, trips, onSelect } = opts;
  const desktopQuery = matchMedia('(min-width: 900px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const world = (await fetch('/data/land-110m.json').then((r) =>
    r.json(),
  )) as Topology;
  const land = feature(world, world.objects.land as never);
  const graticule = geoGraticule10();

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponible');

  const projection = geoOrthographic().clipAngle(90).precision(0.4);
  const path = geoPath(projection, ctx);

  let active = opts.active;
  let rot: Rotation = INITIAL_ROTATION;
  let resumeAt = 0;
  let anim: { t0: number; f: (t: number) => number[] } | null = null;
  let drag: { x: number; y: number; rot: Rotation; moved: boolean } | null =
    null;
  let onScreen = false;
  let raf = 0;
  let last = 0;
  let width = 0;
  let height = 0;
  let baseScale = 0;
  let zoom = 1;
  const pointers = new Map<number, [number, number]>();
  let pinch: { dist: number; zoom: number } | null = null;
  let gestureWasPinch = false;

  const target = (i: number): Rotation => [-trips[i].lon, -trips[i].lat, 0];
  if (opts.focus !== undefined) {
    rot = target(opts.focus);
    resumeAt = performance.now() + RESUME_DELAY_MS;
  }

  const layout = () =>
    desktopQuery.matches ? LAYOUTS.desktop : LAYOUTS.mobile;
  const isVisible = (t: GlobeTrip) =>
    geoDistance([t.lon, t.lat], [-rot[0], -rot[1]]) < Math.PI / 2 - 0.05;
  // Le globe tourne toujours ; il marque une pause pendant un geste ou une transition, puis reprend.
  const autoRotating = (now: number) =>
    !drag && pointers.size === 0 && now >= resumeAt && !reducedMotion.matches;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    const l = layout();
    baseScale = Math.min(width, height) * l.k;
    projection.translate([width / 2, height / 2 + l.dy]);
    wake();
  }

  function tick(now: number) {
    const dt = last ? Math.min(now - last, 64) : 16.67;
    last = now;
    if (anim) {
      const p = Math.min(1, Math.max(0, (now - anim.t0) / ANIM_MS));
      rot = anim.f(easeCubicInOut(p)) as Rotation;
      if (p >= 1) {
        anim = null;
        resumeAt = now + RESUME_DELAY_MS;
      }
    } else if (autoRotating(now)) {
      rot = [rot[0] + AUTO_ROTATE_DEG_PER_FRAME * (dt / 16.67), rot[1], 0];
    }
  }

  function draw() {
    if (!ctx) return;
    projection.rotate(rot).scale(baseScale * zoom);
    const r = projection.scale();
    const [cx, cy] = projection.translate();
    const l = layout();

    ctx.clearRect(0, 0, width, height);

    const halo = ctx.createRadialGradient(cx, cy, r * 0.95, cx, cy, r * 1.3);
    halo.addColorStop(0, 'rgba(255,255,255,0.08)');
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);

    ctx.beginPath();
    path({ type: 'Sphere' });
    ctx.fillStyle = '#0a0a09';
    ctx.fill();
    ctx.strokeStyle = '#2c2c2a';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    path(graticule);
    ctx.strokeStyle = '#191918';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.beginPath();
    path(land);
    ctx.fillStyle = '#272725';
    ctx.fill();
    ctx.strokeStyle = '#3d3d3a';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.beginPath();
    path({ type: 'LineString', coordinates: trips.map((t) => [t.lon, t.lat]) });
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = '#6a6964';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `500 ${l.font}px "Geist Mono Variable", ui-monospace, monospace`;
    trips.forEach((t, i) => {
      if (!isVisible(t)) return;
      const p = projection([t.lon, t.lat]);
      if (!p) return;
      const [x, y] = p;
      const isActive = i === active;
      if (isActive) {
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,.12)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#bdbcb7';
        ctx.fill();
      }
      ctx.fillStyle = isActive ? '#fff' : '#9a9994';
      ctx.fillText(l.label(t), x + 9, y + 3.5);
    });
  }

  function frame(now: number) {
    raf = 0;
    if (!onScreen) return;
    tick(now);
    draw();
    if (anim || drag || !reducedMotion.matches)
      raf = requestAnimationFrame(frame);
    else last = 0;
  }

  function wake() {
    if (!raf && onScreen) raf = requestAnimationFrame(frame);
  }

  function pointer(e: PointerEvent): [number, number] {
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  const setZoom = (z: number) => {
    zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
    wake();
  };

  const pinchDistance = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  };

  canvas.addEventListener('pointerdown', (e) => {
    const [x, y] = pointer(e);
    pointers.set(e.pointerId, [x, y]);
    anim = null;
    canvas.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {
      drag = null;
      gestureWasPinch = true;
      pinch = { dist: pinchDistance(), zoom };
    } else if (pointers.size === 1) {
      gestureWasPinch = false;
      drag = { x, y, rot: [...rot], moved: false };
      canvas.style.cursor = 'grabbing';
    }
    wake();
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    const [x, y] = pointer(e);
    pointers.set(e.pointerId, [x, y]);
    if (pinch && pointers.size === 2) {
      setZoom(pinch.zoom * (pinchDistance() / pinch.dist));
      return;
    }
    if (!drag) return;
    const dx = x - drag.x;
    const dy = y - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > TAP_SLOP) drag.moved = true;
    const k = 0.4 / zoom;
    rot = [
      drag.rot[0] + dx * k,
      Math.max(-85, Math.min(85, drag.rot[1] - dy * k)),
      0,
    ];
    wake();
  });

  const release = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    pinch = null;
    drag = null;
    resumeAt = performance.now() + RESUME_DELAY_MS;
    if (pointers.size === 0) canvas.style.cursor = 'grab';
  };

  canvas.addEventListener('pointercancel', release);

  canvas.addEventListener('pointerup', (e) => {
    const d = drag;
    release(e);
    if (!d || d.moved || gestureWasPinch) return;
    const [mx, my] = pointer(e);
    let best = -1;
    let bestDist = HIT_RADIUS;
    trips.forEach((t, i) => {
      if (!isVisible(t)) return;
      const p = projection([t.lon, t.lat]);
      if (!p) return;
      const dist = Math.hypot(p[0] - mx, p[1] - my);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    if (best >= 0) onSelect(best);
  });

  // Molette / pincement du trackpad (ctrlKey) : zoom exponentiel.
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      setZoom(zoom * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
    },
    { passive: false },
  );

  new ResizeObserver(resize).observe(canvas);
  desktopQuery.addEventListener('change', resize);
  reducedMotion.addEventListener('change', wake);
  new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1].isIntersecting;
    if (onScreen) wake();
    else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    }
  }).observe(canvas);

  document.fonts
    .load('500 11px "Geist Mono Variable"')
    .then(wake)
    .catch(() => {});

  resize();

  return {
    setActive(i) {
      active = i;
      wake();
    },
    rotateTo(i) {
      const to = target(i);
      if (reducedMotion.matches) {
        rot = to;
        anim = null;
      } else {
        const from: Rotation = [...rot];
        while (from[0] - to[0] > 180) from[0] -= 360;
        while (to[0] - from[0] > 180) from[0] += 360;
        anim = { t0: performance.now(), f: interpolateArray(from, to) };
      }
      wake();
    },
  };
}

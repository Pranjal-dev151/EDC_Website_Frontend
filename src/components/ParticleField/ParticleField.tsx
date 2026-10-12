import { useEffect, useRef } from 'react';
import styles from './ParticleField.module.css';

interface Particle {
  bx: number;
  by: number;
  x: number;
  y: number;
  z: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  speed: number;
  color: string;
  alpha: number;
}

const PALETTE: Array<{ color: string; weight: number; alpha: [number, number]; size: [number, number] }> = [
  { color: '#e63946', weight: 0.22, alpha: [0.35, 0.8], size: [1.2, 3.2] },
  { color: '#8a1622', weight: 0.24, alpha: [0.25, 0.6], size: [1.5, 4.0] },
  { color: '#ffffff', weight: 0.26, alpha: [0.25, 0.7], size: [0.8, 2.4] },
  { color: '#c0c0c0', weight: 0.28, alpha: [0.2, 0.55], size: [0.8, 2.6] },
];

function pickColor(rand: () => number): { color: string; alpha: number; size: number } {
  let v = rand();
  for (const p of PALETTE) {
    if (v < p.weight) {
      const alpha = p.alpha[0] + rand() * (p.alpha[1] - p.alpha[0]);
      const size = p.size[0] + rand() * (p.size[1] - p.size[0]);
      return { color: p.color, alpha, size };
    }
    v -= p.weight;
  }
  return { color: '#c0c0c0', alpha: 0.4, size: 1.6 };
}

export default function ParticleField({ influenceRadius = 150 }: { influenceRadius?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef({ x: 0, y: 0, sx: 0, sy: 0, active: false, strength: 0 });

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const wrapEl = wrapRef.current;
    if (!canvasEl || !wrapEl) return;
    const ctx2d = canvasEl.getContext('2d');
    if (!ctx2d) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const wrap: HTMLDivElement = wrapEl;
    const ctx: CanvasRenderingContext2D = ctx2d;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const small = window.innerWidth < 640;

    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    let inView = true;
    let t = Math.random() * 1000;

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

    function countForArea(area: number, width: number): number {
      // Dense immersive field, scales with viewport. Wider screens get proportionally more.
      const widthBoost = Math.min(1.8, Math.max(0.8, width / 1280));
      if (small || coarse) return Math.min(240, Math.max(130, Math.floor((area / 8000) * widthBoost)));
      return Math.min(780, Math.max(380, Math.floor((area / 2800) * widthBoost)));
    }

    function resize() {
      const rect = wrap.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      const d = dpr();
      canvas.width = Math.floor(w * d);
      canvas.height = Math.floor(h * d);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      seed();
    }

    function seed() {
      const n = countForArea(w * h, w);
      particles = new Array(n);
      // Stratified depth: even Z distribution across 5 bins so the field
      // fills uniformly instead of clustering at one depth.
      const BINS = 5;
      for (let i = 0; i < n; i++) {
        const bin = i % BINS;
        const z = Math.min(1, Math.max(0.25, 0.28 + (bin / BINS) * 0.72 + (Math.random() - 0.5) * 0.12));
        const c = pickColor(Math.random);
        particles[i] = {
          bx: Math.random() * w,
          by: Math.random() * h,
          x: 0,
          y: 0,
          z,
          r: c.size * (0.5 + z * 0.9),
          vx: (Math.random() - 0.5) * 0.16 * z,
          vy: (Math.random() - 0.5) * 0.12 * z,
          phase: Math.random() * Math.PI * 2,
          speed: 0.2 + Math.random() * 0.6,
          color: c.color,
          alpha: c.alpha,
        };
        particles[i].x = particles[i].bx;
        particles[i].y = particles[i].by;
      }
      cursorRef.current.sx = w / 2;
      cursorRef.current.sy = h / 2;
      cursorRef.current.x = w / 2;
      cursorRef.current.y = h / 2;
    }

    function frame() {
      if (!running) return;
      if (!inView || document.hidden) {
        raf = requestAnimationFrame(frame);
        return;
      }
      t += 0.016;
      const cur = cursorRef.current;
      // Smooth cursor follow with damping — no abrupt jumps
      cur.sx += (cur.x - cur.sx) * 0.1;
      cur.sy += (cur.y - cur.sy) * 0.1;
      const targetStrength = cur.active ? 1 : 0;
      cur.strength += (targetStrength - cur.strength) * 0.06;

      ctx.clearRect(0, 0, w, h);

      const R = influenceRadius;
      const R2 = R * R;

      for (const p of particles) {
        // Ambient drift
        p.bx += p.vx;
        p.by += p.vy + Math.sin(t * p.speed + p.phase) * 0.08 * p.z;
        p.bx += Math.cos(t * p.speed * 0.7 + p.phase) * 0.05 * p.z;
        if (p.bx < -20) p.bx = w + 20;
        else if (p.bx > w + 20) p.bx = -20;
        if (p.by < -20) p.by = h + 20;
        else if (p.by > h + 20) p.by = -20;

        let ox = 0;
        let oy = 0;
        let boost = 0;

        if (cur.strength > 0.01) {
          // Depth parallax: cursor appears shifted per-particle depth
          const px = cur.sx + (cur.sx - w / 2) * (p.z - 0.65) * 0.18;
          const py = cur.sy + (cur.sy - h / 2) * (p.z - 0.65) * 0.18;
          const dx = p.bx - px;
          const dy = p.by - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            const dist = Math.sqrt(d2) || 0.001;
            const fall = 1 - dist / R;
            const smooth = fall * fall * (3 - 2 * fall);
            // Volumetric push: radial separation scaled by depth + tangential swirl
            const push = smooth * 26 * p.z * cur.strength;
            const nx = dx / dist;
            const ny = dy / dist;
            ox = nx * push + -ny * push * 0.35;
            oy = ny * push + nx * push * 0.35;
            // Slight attraction ring near shell edge keeps sphere full, not hollow
            const shell = Math.sin(smooth * Math.PI);
            ox -= nx * shell * 6 * p.z * cur.strength;
            oy -= ny * shell * 6 * p.z * cur.strength;
            boost = smooth;
          }
        }

        // Settle gently when stationary: ease offsets via lerp
        p.x += (p.bx + ox - p.x) * 0.12;
        p.y += (p.by + oy - p.y) * 0.12;

        const twinkle = 0.75 + 0.25 * Math.sin(t * p.speed * 2 + p.phase);
        // Readability without an overlay: gently dim/shrink particles near
        // the screen center where the headline sits. No background gradient.
        const nx = (p.x - w / 2) / (w / 2 || 1);
        const ny = (p.y - h / 2) / (h / 2 || 1);
        const centerDist = Math.min(1, Math.sqrt(nx * nx + ny * ny) / Math.SQRT2);
        const centerDim = 0.55 + 0.45 * (centerDist * centerDist * (3 - 2 * centerDist));
        const alpha = Math.min(1, p.alpha * twinkle * centerDim + boost * 0.25);
        const rad = p.r * centerDim * (1 + boost * 0.35);

        // Bubble-like: filled core + soft rim
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
        // Highlight dot for depth
        if (rad > 1.4) {
          ctx.globalAlpha = alpha * 0.55;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x - rad * 0.3, p.y - rad * 0.3, Math.max(0.4, rad * 0.28), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (reduced) return; // single static frame
      raf = requestAnimationFrame(frame);
    }

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    io.observe(wrap);

    const onVis = () => {
      // rAF loop self-throttles via document.hidden check
    };
    document.addEventListener('visibilitychange', onVis);

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    frame();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [influenceRadius]);

  // Pointer tracking is attached to the hero parent via data attrs below;
  // expose a stable updater through the wrapper element.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    (wrap as unknown as { __cursorRef?: typeof cursorRef }).__cursorRef = cursorRef;
  }, []);

  return (
    <div ref={wrapRef} className={styles.field} aria-hidden="true" data-particle-field>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.fallback} aria-hidden="true" />
    </div>
  );
}

export function setParticleCursor(
  heroEl: HTMLElement | null,
  clientX: number,
  clientY: number,
  active: boolean,
) {
  if (!heroEl) return;
  const field = heroEl.querySelector<HTMLElement>('[data-particle-field]');
  const ref = (field as unknown as { __cursorRef?: { current: { x: number; y: number; active: boolean } } } | null)?.__cursorRef;
  if (!ref) return;
  const rect = heroEl.getBoundingClientRect();
  ref.current.x = clientX - rect.left;
  ref.current.y = clientY - rect.top;
  ref.current.active = active;
}

export function releaseParticleCursor(heroEl: HTMLElement | null) {
  if (!heroEl) return;
  const field = heroEl.querySelector<HTMLElement>('[data-particle-field]');
  const ref = (field as unknown as { __cursorRef?: { current: { active: boolean } } } | null)?.__cursorRef;
  if (ref) ref.current.active = false;
}

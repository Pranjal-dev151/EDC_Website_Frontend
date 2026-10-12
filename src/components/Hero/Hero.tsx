import { useEffect, useRef } from 'react';
import ParticleField, { releaseParticleCursor, setParticleCursor } from '../ParticleField/ParticleField';
import styles from './Hero.module.css';

interface HeroProps {
  eyebrow: string;
  title: string;
  description: string;
  primaryLink: { label: string; href: string };
  secondaryLink: { label: string; href: string };
}

export default function Hero({ eyebrow, title, description, primaryLink, secondaryLink }: HeroProps) {
  const heroRef = useRef<HTMLElement>(null);

  // Cursor tracking through the parent — no React state per pointer move
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (e: PointerEvent) => {
      setParticleCursor(hero, e.clientX, e.clientY, true);
    };
    const onLeave = () => releaseParticleCursor(hero);
    hero.addEventListener('pointermove', onMove, { passive: true });
    hero.addEventListener('pointerleave', onLeave);
    hero.addEventListener('pointercancel', onLeave);
    return () => {
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      hero.removeEventListener('pointercancel', onLeave);
    };
  }, []);

  return (
    <section className={styles.hero} ref={heroRef} data-header-region aria-labelledby="hero-title">
      <div className={styles.heroSticky}>
        <div className={styles.heroContainer} aria-hidden="true">
          <ParticleField influenceRadius={170} />
        </div>
        <div className={styles.heroCopy}>
          <p className="eyebrow">{eyebrow}</p>
          <h1 id="hero-title">{title}</h1>
          <p className={styles.description}>{description}</p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('initiatives')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {primaryLink.label}
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('events')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {secondaryLink.label}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

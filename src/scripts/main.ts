import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initEmbers } from './embers';
import { initImpasto, initMeteo, initOpenStatus, initSeason } from './live';
import { initMap } from './map';

// Header e indicatore degli strati: funzionano anche senza animazioni.
function initChrome() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const gauge = document.querySelector<HTMLElement>('[data-gauge]');
  const fill = document.querySelector<HTMLElement>('[data-gauge-fill]');
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-stratum]'));
  const gaugeItems = Array.from(document.querySelectorAll<HTMLElement>('[data-gauge-item]'));
  let lastY = window.scrollY;
  let ticking = false;

  const themeAt = (y: number) =>
    sections.find((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= y && r.bottom > y;
    });

  const update = () => {
    ticking = false;
    const y = window.scrollY;

    if (header) {
      header.classList.toggle('is-scrolled', y > 40);
      header.classList.toggle('is-hidden', y > lastY && y > window.innerHeight * 0.8);
      header.classList.toggle('is-light', themeAt(36)?.dataset.theme === 'light');
    }

    const mid = window.innerHeight / 2;
    const current = themeAt(mid);
    gauge?.classList.toggle('is-light', current?.dataset.theme === 'light');
    gaugeItems.forEach((g) => g.classList.toggle('is-active', g.dataset.gaugeItem === current?.dataset.stratum));
    if (fill) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      fill.style.height = `${Math.min(100, (y / Math.max(1, max)) * 100)}%`;
    }
    lastY = y;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

function initMotion() {
  gsap.registerPlugin(ScrollTrigger);

  // Hero: le lettere del nome emergono dalla cenere, poi il resto.
  const letters = gsap.utils.toArray<HTMLElement>('.cenere__title .ch');
  gsap
    .timeline({ defaults: { ease: 'expo.out' } })
    .from(letters, { yPercent: 110, rotate: 8, opacity: 0, filter: 'blur(8px)', duration: 1.4, stagger: 0.045 })
    .from('[data-hero-fade]', { y: 24, opacity: 0, duration: 1, stagger: 0.12 }, '-=0.9');

  // Scorrendo, il nome si disperde come cenere.
  gsap.to(letters, {
    yPercent: (i) => -30 - (i % 5) * 18,
    opacity: 0,
    ease: 'none',
    stagger: { each: 0.02, from: 'random' },
    scrollTrigger: { trigger: '#cenere', start: 'top top', end: 'bottom top', scrub: true },
  });

  // Elementi che entrano dal basso. Il contenuto resta visibile anche se lo script non parte.
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 92%',
    once: true,
    onEnter: (els) =>
      gsap.fromTo(els, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1 }),
  });

  // Numeri del forno che salgono.
  gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => (el.textContent = String(Math.round(obj.v))),
    });
  });

  // Il forno si accende man mano che si scende nello strato del fuoco.
  const fire = document.querySelector<HTMLElement>('[data-oven-fire]');
  if (fire) {
    gsap.fromTo(
      fire,
      { '--heat': 0.3 },
      { '--heat': 1, ease: 'none', scrollTrigger: { trigger: '#fuoco', start: 'top 80%', end: 'center center', scrub: true } },
    );
  }

  // La vite si disegna lungo lo strato della vigna.
  const vine = document.querySelector<SVGPathElement>('[data-vine]');
  if (vine) {
    gsap.fromTo(
      vine,
      { '--draw': 1 },
      { '--draw': 0, ease: 'none', scrollTrigger: { trigger: '#vigna', start: 'top 70%', end: 'bottom 60%', scrub: true } },
    );
  }

  // Confini tra strati: le onde scorrono a velocità diverse.
  gsap.utils.toArray<SVGPathElement>('[data-edge-depth]').forEach((path) => {
    const depth = Number(path.dataset.edgeDepth);
    gsap.fromTo(
      path,
      { x: -40 * depth },
      { x: 40 * depth, ease: 'none', scrollTrigger: { trigger: path.closest('.edge'), start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });
}

export function initPage() {
  const motion = document.documentElement.classList.contains('motion');

  const canvas = document.querySelector<HTMLCanvasElement>('[data-embers]');
  if (canvas) initEmbers(canvas, motion);

  initChrome();
  initSeason();
  initOpenStatus();
  initImpasto();
  initMap();
  initMeteo();
  if (motion) initMotion();
}

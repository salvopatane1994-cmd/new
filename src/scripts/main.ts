import { initScene } from './scene';
import { drawPizza, type PizzaSpec } from './pizza';
import { initLive } from './live';
import { initOrder } from './order';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// Pizze del menu: si compongono mentre salgono nello schermo e girano come sulla pala.
function menuPizzas(motion: boolean) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const items = Array.from(document.querySelectorAll<HTMLCanvasElement>('[data-pizza-canvas]')).map((canvas) => ({
    canvas,
    ctx: canvas.getContext('2d')!,
    spec: JSON.parse(canvas.dataset.spec ?? '{}') as PizzaSpec,
    last: -1,
    size: 0,
  }));

  const draw = (it: (typeof items)[number], t: number) => {
    const size = Math.round(it.canvas.clientWidth * dpr);
    if (size !== it.size) {
      it.size = size;
      it.canvas.width = size;
      it.canvas.height = size;
      it.last = -1;
    }
    const q = Math.round(t * 50) / 50;
    if (q === it.last) return;
    it.last = q;
    it.ctx.setTransform(1, 0, 0, 1, 0, 0);
    it.ctx.clearRect(0, 0, size, size);
    drawPizza(it.ctx, size / 2, size / 2, size * 0.47, it.spec, q);
  };

  if (!motion) {
    items.forEach((it) => draw(it, 1));
    return () => {};
  }
  return () => {
    const vh = window.innerHeight;
    for (const it of items) {
      const r = it.canvas.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) continue;
      const t = clamp((vh - r.top) / (vh * 0.62));
      draw(it, t);
      it.canvas.style.transform = `rotate(${(r.top * 0.08).toFixed(2)}deg)`;
    }
  };
}

// Ingredienti uno alla volta, con la mappa che accende il paese.
function terraSequence(motion: boolean) {
  const root = document.querySelector<HTMLElement>('[data-terra]');
  if (!root || !motion) return () => {};
  root.classList.add('is-ready');
  const words = Array.from(root.querySelectorAll<HTMLElement>('[data-word]'));
  let current = -1;
  return () => {
    const r = root.getBoundingClientRect();
    const total = root.offsetHeight - window.innerHeight;
    const p = clamp(-r.top / Math.max(1, total));
    const i = Math.min(words.length - 1, Math.floor(p * words.length));
    if (i === current) return;
    words.forEach((w, k) => {
      w.classList.toggle('is-on', k === i);
      w.classList.toggle('was-on', k < i);
    });
    const id = words[i].dataset.word;
    root.querySelectorAll<SVGElement>('[data-route]').forEach((el) => el.classList.toggle('is-on', el.dataset.route === id));
    root.querySelectorAll<SVGElement>('[data-pin]').forEach((el) => el.classList.toggle('is-on', el.dataset.pin === id));
    current = i;
  };
}

// La frase sul vino si accende parola per parola.
function statement(motion: boolean) {
  const el = document.querySelector<HTMLElement>('[data-statement]');
  if (!el || !motion) return () => {};
  const words = Array.from(el.querySelectorAll<HTMLElement>('.w'));
  return () => {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * 0.85 - r.top) / (vh * 0.55 + r.height * 0.5));
    const lit = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
  };
}

// Fasce di testo che scorrono di lato insieme allo scroll.
function bands(motion: boolean) {
  const runs = Array.from(document.querySelectorAll<HTMLElement>('[data-fascia]'));
  if (!motion) return () => {};
  return () => {
    for (const el of runs) {
      const half = el.scrollWidth / 2;
      const dir = Number(el.dataset.dir ?? -1);
      const offset = ((window.scrollY * 0.4) % half) * dir;
      el.style.transform = `translate3d(${dir < 0 ? offset : offset - half}px, 0, 0)`;
    }
  };
}

function topBar() {
  const top = document.querySelector<HTMLElement>('[data-top]');
  const scene = document.querySelector<HTMLElement>('[data-discesa]');
  return () => {
    if (!top || !scene) return;
    const end = scene.offsetTop + scene.offsetHeight - window.innerHeight;
    top.classList.toggle('is-solid', window.scrollY > end - 10);
  };
}

export function initPage() {
  const motion = document.documentElement.classList.contains('motion');
  const scene = document.querySelector<HTMLElement>('[data-discesa]');
  if (scene) initScene(scene, motion);

  initLive();
  initOrder();

  const updates = [menuPizzas(motion), terraSequence(motion), statement(motion), bands(motion), topBar()];
  let ticking = false;
  const run = () => {
    ticking = false;
    updates.forEach((u) => u());
  };
  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(run);
    }
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  document.fonts?.ready.then(request);
  run();
}

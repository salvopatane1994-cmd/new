// "Dal cratere al forno": la sezione resta ferma sullo schermo e lo scroll muove la camera.
// p = 0 sagoma dell'Etna di notte · 0.32 dentro la lava · 0.62 la lava diventa fiamma · 0.78 bocca del forno · 1 pizza cotta.
import { createLava } from './lava';
import { drawPizza } from './pizza';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

interface Spark { x: number; y: number; v: number; r: number; life: number; max: number }

export function initScene(root: HTMLElement, motion: boolean) {
  const lavaCanvas = root.querySelector<HTMLCanvasElement>('[data-lava]')!;
  const canvas = root.querySelector<HTMLCanvasElement>('[data-scene]')!;
  const ctx = canvas.getContext('2d')!;
  const beats = Array.from(root.querySelectorAll<HTMLElement>('[data-beat]')).map((el) => {
    const [a, b] = (el.dataset.beat ?? '0 1').split(' ').map(Number);
    return { el, a, b };
  });
  const hudTemp = root.querySelector<HTMLElement>('[data-hud-temp]');
  const hudPhase = root.querySelector<HTMLElement>('[data-hud-phase]');
  const tempBig = root.querySelector<HTMLElement>('[data-temp-big]');
  const progressEl = root.querySelector<HTMLElement>('[data-progress]');
  const hint = root.querySelector<HTMLElement>('[data-hint]');

  const lava = createLava(lavaCanvas, window.innerWidth < 700 ? 0.45 : 0.6);
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let W = 0;
  let H = 0;
  let stars: { x: number; y: number; r: number; ph: number }[] = [];
  let sparks: Spark[] = [];

  const resize = () => {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.round((W * H) / 5000) }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.5,
      r: Math.random() * 1.1 + 0.2,
      ph: Math.random() * Math.PI * 2,
    }));
  };

  // ---------- Etna di notte ----------
  // Profilo largo e dolce, come l'Etna vero: ripido in cima, quasi piatto alla base.
  // In verticale la montagna è più larga dello schermo, così non diventa un cono stretto.
  const crater = () => ({ x: W * 0.5, y: H * 0.5 });
  const worldW = () => Math.max(W, H * 1.15);

  function profile(x: number) {
    const c = crater();
    const half = worldW() * 0.85;
    const top = half * 0.045; // sommità tronca, con i crateri
    const d = Math.min(1, Math.max(0, Math.abs(x - c.x) - top) / (half - top));
    let y = c.y + H * 0.3 * (1 - Math.pow(1 - d, 1.5));
    // Coni secondari sui fianchi.
    const bump = (cx: number, w: number, h: number) => h * Math.exp(-((x - cx) ** 2) / (2 * w * w));
    y -= bump(c.x + half * 0.3, half * 0.03, H * 0.012);
    y -= bump(c.x + half * 0.44, half * 0.025, H * 0.008);
    y -= bump(c.x - half * 0.36, half * 0.04, H * 0.01);
    y -= bump(c.x - top * 0.6, top * 0.35, H * 0.006);
    // Bocca del cratere: tacca sulla cima.
    y += bump(c.x + top * 0.15, top * 0.3, H * 0.007);
    return y;
  }

  function mountainPath() {
    const c = crater();
    const half = worldW() * 0.9;
    ctx.beginPath();
    ctx.moveTo(c.x - half, profile(c.x - half));
    for (let x = c.x - half; x <= c.x + half; x += Math.max(2, W / 120)) ctx.lineTo(x, profile(x));
    ctx.lineTo(c.x + half, H * 3);
    ctx.lineTo(c.x - half, H * 3);
    ctx.closePath();
  }

  function plume(time: number, alpha: number) {
    const c = crater();
    for (let i = 0; i < 9; i++) {
      const k = i / 8;
      const px = c.x + k * W * 0.55 + Math.sin(time * 0.3 + i) * W * 0.02;
      const py = c.y - H * 0.04 - k * H * 0.3 - Math.sin(time * 0.2 + i * 1.3) * H * 0.01;
      const r = W * (0.06 + k * 0.22);
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      const warm = Math.max(0, 1 - k * 2.2);
      g.addColorStop(0, `rgba(${Math.round(70 + 120 * warm)}, ${Math.round(58 + 30 * warm)}, ${Math.round(54 + 10 * warm)}, ${0.42 * alpha * (1 - k * 0.5)})`);
      g.addColorStop(1, 'rgba(60, 52, 50, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawVolcano(p: number, time: number) {
    const z = seg(p, 0.03, 0.24);
    const zoom = Math.exp(easeInOut(z) * Math.log(14));
    const c = crater();

    // Cielo, in coordinate dello schermo.
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#05050a');
    sky.addColorStop(0.5, '#100a0c');
    sky.addColorStop(1, '#240d07');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f1ebe2';
    for (const s of stars) {
      ctx.globalAlpha = (0.35 + 0.35 * Math.sin(time * 1.3 + s.ph)) * (1 - z);
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-c.x, -c.y);

    plume(time, 1 - seg(z, 0.2, 0.6));

    // Bagliore del cratere sul cielo e sul pennacchio.
    const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, W * 0.45);
    glow.addColorStop(0, `rgba(255, 96, 32, ${0.45 + 0.08 * Math.sin(time * 2.4)})`);
    glow.addColorStop(1, 'rgba(255, 96, 32, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(c.x - W, c.y - W, W * 2, W * 2);

    // Montagna, con il bordo appena illuminato dalla luna.
    mountainPath();
    const rock = ctx.createLinearGradient(0, c.y, 0, H);
    rock.addColorStop(0, '#1e1816');
    rock.addColorStop(1, '#090706');
    ctx.fillStyle = rock;
    ctx.fill();
    ctx.strokeStyle = 'rgba(241, 235, 226, 0.16)';
    ctx.lineWidth = 1.2 / zoom;
    ctx.stroke();

    // Colata che scende verso est, nella Valle del Bove, sopra Milo.
    const flow = new Path2D();
    const fx = (k: number) => c.x + W * 0.02 + k * W * 0.2 + Math.sin(k * 11) * W * 0.01;
    flow.moveTo(fx(0), profile(fx(0)) + 2);
    for (let k = 0.04; k <= 1; k += 0.04) flow.lineTo(fx(k), profile(fx(k)) + H * 0.004 + k * H * 0.02);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255, 74, 20, 0.3)';
    ctx.lineWidth = 6 / Math.sqrt(zoom);
    ctx.stroke(flow);
    ctx.strokeStyle = 'rgba(255, 174, 66, 0.9)';
    ctx.lineWidth = 1.4 / Math.sqrt(zoom);
    ctx.stroke(flow);

    // Le luci di Milo sul fianco est.
    const mx = Math.min(c.x + worldW() * 0.24, W * 0.86);
    const my = profile(mx) + H * 0.02;
    for (let i = 0; i < 16; i++) {
      const lx = mx + Math.sin(i * 12.9) * W * 0.04;
      const ly = my + Math.cos(i * 7.3) * H * 0.008;
      ctx.fillStyle = `rgba(255, 196, 120, ${0.55 + 0.45 * Math.sin(time * 2 + i)})`;
      ctx.fillRect(lx, ly, 1.6, 1.6);
    }
    ctx.globalAlpha = 1 - seg(z, 0, 0.25);
    ctx.font = `500 ${Math.max(10, Math.min(13, W * 0.028))}px "IBM Plex Mono", monospace`;
    ctx.fillStyle = 'rgba(241, 235, 226, 0.85)';
    ctx.textAlign = 'right';
    ctx.fillText('MILO · 720 M', mx + W * 0.05, my + H * 0.04);
    ctx.globalAlpha = 1;

    // Bocca del cratere: sotto c'è la lava (canvas WebGL).
    ctx.save();
    mountainPath();
    ctx.clip();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + H * 0.008, W * 0.026, H * 0.006, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();

    // Tuffo nella luce: il bagliore del cratere riempie lo schermo, poi lascia la lava.
    const flash = seg(p, 0.16, 0.25) * (1 - seg(p, 0.26, 0.33));
    if (flash > 0) {
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) * 0.6);
      g.addColorStop(0, `rgba(255, 236, 200, ${flash})`);
      g.addColorStop(0.45, `rgba(255, 150, 60, ${flash})`);
      g.addColorStop(1, `rgba(200, 50, 15, ${flash})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ---------- Forno ----------
  const pizzaSpec = { base: 'rossa' as const, draw: ['mozzarella', 'basilico', 'olio'], seed: 21 };
  const pizzaBuf = document.createElement('canvas');
  const pctx = pizzaBuf.getContext('2d')!;
  let lastBake = -1;

  function drawOven(p: number) {
    const k = easeOut(seg(p, 0.78, 0.9));
    const scale = lerp(9, 1, k);
    const aw = Math.min(W * 0.86, H * 0.62);
    const ah = aw * 0.58;
    const wide = W > 900;
    const ax = wide ? W * 0.64 : W / 2; // su schermi larghi il testo sta a sinistra del forno
    const ay = H * (wide ? 0.78 : 0.7); // base dell'arco
    ctx.save();
    ctx.translate(ax, ay - ah / 2);
    ctx.scale(scale, scale);
    ctx.translate(-ax, -(ay - ah / 2));

    // Facciata in pietra lavica con l'arco aperto (regola evenodd).
    const arch = new Path2D();
    arch.moveTo(ax - aw / 2, ay);
    arch.lineTo(ax - aw / 2, ay - ah * 0.35);
    arch.bezierCurveTo(ax - aw / 2, ay - ah * 1.05, ax + aw / 2, ay - ah * 1.05, ax + aw / 2, ay - ah * 0.35);
    arch.lineTo(ax + aw / 2, ay);
    arch.closePath();
    const facade = new Path2D();
    facade.rect(-W * 2, -H * 2, W * 5, H * 5);
    facade.addPath(arch);
    const stone = ctx.createRadialGradient(ax, ay - ah * 0.4, aw * 0.3, ax, ay - ah * 0.4, Math.max(W, H));
    stone.addColorStop(0, '#3a2620');
    stone.addColorStop(0.35, '#1c1513');
    stone.addColorStop(1, '#0b0908');
    ctx.fillStyle = stone;
    ctx.fill(facade, 'evenodd');

    // Conci dell'arco e filari di mattoni.
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = 2 / scale;
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI + (i / 14) * Math.PI;
      const rx = aw / 2;
      const ry = ah * 0.7;
      const cy = ay - ah * 0.35;
      ctx.beginPath();
      ctx.moveTo(ax + Math.cos(a) * rx, cy + Math.sin(a) * ry);
      ctx.lineTo(ax + Math.cos(a) * (rx + aw * 0.12), cy + Math.sin(a) * (ry + aw * 0.12));
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255, 140, 70, 0.08)';
    for (let y = ay + 18; y < H * 1.5; y += 22) {
      ctx.beginPath();
      ctx.moveTo(-W, y);
      ctx.lineTo(W * 2, y);
      ctx.stroke();
    }

    // Piano del forno e pizza, dentro l'arco.
    ctx.save();
    ctx.clip(arch);
    const floor = ctx.createLinearGradient(0, ay - ah * 0.3, 0, ay);
    floor.addColorStop(0, 'rgba(60, 20, 10, 0)');
    floor.addColorStop(1, 'rgba(60, 24, 12, 0.85)');
    ctx.fillStyle = floor;
    ctx.fillRect(ax - aw, ay - ah * 0.3, aw * 2, ah * 0.3);

    const slide = easeOut(seg(p, 0.83, 0.9));
    const bake = seg(p, 0.9, 1);
    if (slide > 0) {
      const R = aw * 0.3;
      const size = Math.ceil(R * 2.2 * dpr);
      if (pizzaBuf.width !== size) {
        pizzaBuf.width = size;
        pizzaBuf.height = size;
        lastBake = -1;
      }
      const bakeStep = Math.round(bake * 20) / 20;
      if (bakeStep !== lastBake) {
        lastBake = bakeStep;
        pctx.setTransform(1, 0, 0, 1, 0, 0);
        pctx.clearRect(0, 0, size, size);
        pctx.scale(dpr, dpr);
        drawPizza(pctx, R * 1.1, R * 1.1, R * (1 + 0.04 * bakeStep), pizzaSpec, 0.85 + 0.15 * bakeStep);
      }
      const py = lerp(ay + R, ay - R * 0.42, slide);
      ctx.drawImage(pizzaBuf, ax - R * 1.1, py - R * 1.1 * 0.34, R * 2.2, R * 2.2 * 0.34);

      // Pala che entra e poi esce.
      const peel = slide * (1 - seg(p, 0.91, 0.95));
      if (peel > 0) {
        ctx.fillStyle = `rgba(120, 84, 50, ${peel})`;
        ctx.fillRect(ax - aw * 0.03, py + R * 0.1, aw * 0.06, H);
      }
    }
    ctx.restore();

    // Luce del fuoco che esce dall'arco.
    const spill = ctx.createRadialGradient(ax, ay, 0, ax, ay, aw);
    spill.addColorStop(0, 'rgba(255, 110, 40, 0.28)');
    spill.addColorStop(1, 'rgba(255, 110, 40, 0)');
    ctx.fillStyle = spill;
    ctx.fill(facade, 'evenodd');
    ctx.restore();
  }

  function drawFlash(p: number) {
    const flash = 1 - seg(p, 0.26, 0.33);
    if (flash <= 0) return;
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    g.addColorStop(0, `rgba(255, 236, 200, ${flash})`);
    g.addColorStop(0.45, `rgba(255, 150, 60, ${flash})`);
    g.addColorStop(1, `rgba(200, 50, 15, ${flash})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // ---------- Scintille ----------
  function drawSparks(amount: number) {
    const target = Math.round(60 * amount);
    while (sparks.length < target) {
      sparks.push({ x: Math.random() * W, y: H + Math.random() * 40, v: 0.6 + Math.random() * 2.2, r: 0.8 + Math.random() * 1.8, life: 0, max: 80 + Math.random() * 120 });
    }
    if (sparks.length > target) sparks.length = target;
    for (const s of sparks) {
      s.life++;
      s.y -= s.v;
      s.x += Math.sin((s.life + s.max) * 0.05) * 0.6;
      if (s.life > s.max || s.y < -10) {
        s.y = H + 10;
        s.x = Math.random() * W;
        s.life = 0;
      }
      const a = Math.sin(Math.PI * (s.life / s.max));
      ctx.fillStyle = `rgba(255, ${150 + Math.round(80 * a)}, 70, ${a})`;
      ctx.fillRect(s.x, s.y, s.r, s.r * 2);
    }
  }

  // ---------- Testi e HUD ----------
  function temperatureAt(p: number) {
    if (p < 0.2) return 12;
    if (p < 0.4) return Math.round(lerp(12, 1100, easeInOut(seg(p, 0.2, 0.4))));
    if (p < 0.7) return 1100;
    if (p < 0.86) return Math.round(lerp(1100, 450, seg(p, 0.7, 0.86)));
    return 450;
  }
  function phaseAt(p: number) {
    if (p < 0.16) return 'Aria di montagna';
    if (p < 0.3) return 'Cratere';
    if (p < 0.62) return 'Lava';
    if (p < 0.8) return 'Fiamma';
    return 'Forno a legna';
  }
  const fmt = { format: (n: number) => (n >= 1000 ? `${Math.floor(n / 1000)}.${String(n % 1000).padStart(3, '0')}` : String(n)) };

  function updateText(p: number) {
    for (const b of beats) {
      const fade = 0.025;
      let o = Math.min(seg(p, b.a - fade, b.a + fade), 1 - seg(p, b.b - fade, b.b + fade));
      if (b.a <= 0) o = 1 - seg(p, b.b - fade, b.b + fade);
      const center = b.el.classList.contains('beat--center');
      const y = (1 - o) * 30 * (p < (b.a + b.b) / 2 ? 1 : -1);
      b.el.style.opacity = o.toFixed(3);
      b.el.style.transform = center ? `translateY(calc(-50% + ${y}px))` : `translateY(${y}px)`;
      b.el.style.visibility = o > 0.01 ? 'visible' : 'hidden';
    }
    const t = temperatureAt(p);
    if (hudTemp) hudTemp.textContent = `${fmt.format(t)} °C`;
    if (hudPhase) hudPhase.textContent = phaseAt(p);
    if (tempBig) tempBig.textContent = `${fmt.format(Math.max(t, 450))}°`;
    if (progressEl) progressEl.style.height = `${(p * 100).toFixed(1)}%`;
    if (hint) hint.style.opacity = String(1 - seg(p, 0, 0.04));
  }

  // ---------- Ciclo ----------
  let target = 0;
  let shown = 0;
  let raf = 0;
  let running = false;

  const readScroll = () => {
    const rect = root.getBoundingClientRect();
    const total = root.offsetHeight - window.innerHeight;
    target = total > 0 ? clamp(-rect.top / total) : 0;
  };

  function render(time: number) {
    const p = shown;
    ctx.clearRect(0, 0, W, H);

    lava.set({
      zoom: lerp(0.6, 2.4, seg(p, 0.2, 0.62)),
      fire: easeInOut(seg(p, 0.6, 0.76)),
      bright: p > 0.82 ? 0.85 : 1,
    });

    if (p < 0.27) drawVolcano(p, time);
    else drawFlash(p);
    if (p > 0.24) drawSparks(seg(p, 0.24, 0.4) * (p > 0.8 ? 0.6 : 1));
    if (p > 0.77) drawOven(p);
    updateText(p);
  }

  const loop = (now: number) => {
    shown += (target - shown) * 0.14;
    if (Math.abs(target - shown) < 0.0004) shown = target;
    render(now / 1000);
    if (running) raf = requestAnimationFrame(loop);
  };

  resize();
  if (!motion) {
    shown = 0.02;
    render(0);
    return;
  }

  lava.start();
  window.addEventListener('scroll', readScroll, { passive: true });
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW && Math.abs(canvas.clientHeight - H) < 120) return; // barra indirizzi mobile
    lastW = window.innerWidth;
    resize();
  });
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      if (!running) {
        running = true;
        lava.start();
        raf = requestAnimationFrame(loop);
      }
    } else {
      running = false;
      lava.stop();
      cancelAnimationFrame(raf);
    }
  }).observe(root);
  readScroll();
  shown = target;
}

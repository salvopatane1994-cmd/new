// Pizza vista dall'alto, disegnata su canvas. `t` va da 0 a 1 e costruisce la pizza:
// prima l'impasto, poi la base, poi i condimenti uno strato alla volta.

export interface PizzaSpec {
  base: 'rossa' | 'bianca' | 'crema';
  draw: string[];
  seed?: number;
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

// Punto casuale dentro un cerchio, distribuito in modo uniforme.
function inDisc(r: () => number, radius: number) {
  const a = r() * Math.PI * 2;
  const d = Math.sqrt(r()) * radius;
  return [Math.cos(a) * d, Math.sin(a) * d] as const;
}

function blob(ctx: CanvasRenderingContext2D, r: () => number, x: number, y: number, rad: number, wobble = 0.25) {
  const n = 9;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = rad * (1 - wobble / 2 + r() * wobble);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else {
      const pa = ((i - 0.5) / n) * Math.PI * 2;
      ctx.quadraticCurveTo(x + Math.cos(pa) * rr * 1.08, y + Math.sin(pa) * rr * 1.08, px, py);
    }
  }
  ctx.closePath();
}

type Painter = (ctx: CanvasRenderingContext2D, r: () => number, R: number, k: number) => void;

// Ogni condimento disegna `k` (0..1) dei suoi pezzi: così entra in scena progressivamente.
const toppings: Record<string, Painter> = {
  mozzarella(ctx, r, R, k) {
    const n = Math.round(9 * k);
    for (let i = 0; i < n; i++) {
      const [x, y] = inDisc(r, R * 0.68);
      const g = ctx.createRadialGradient(x, y, 0, x, y, R * 0.14);
      g.addColorStop(0, '#fbf6ea');
      g.addColorStop(0.7, '#f1e6cf');
      g.addColorStop(1, 'rgba(241,230,207,0)');
      ctx.fillStyle = g;
      blob(ctx, r, x, y, R * (0.1 + r() * 0.06), 0.45);
      ctx.fill();
    }
  },
  provola(ctx, r, R, k) {
    const n = Math.round(9 * k);
    for (let i = 0; i < n; i++) {
      const [x, y] = inDisc(r, R * 0.66);
      ctx.fillStyle = '#ecc77a';
      blob(ctx, r, x, y, R * (0.09 + r() * 0.05), 0.5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(140,80,30,0.45)';
      ctx.lineWidth = R * 0.012;
      ctx.stroke();
    }
  },
  burrata(ctx, r, R, k) {
    if (k <= 0) return;
    const s = easeOut(k);
    for (let i = 0; i < 3; i++) {
      const x = (r() - 0.5) * R * 0.2;
      const y = (r() - 0.5) * R * 0.2;
      ctx.fillStyle = i === 0 ? '#fffaf0' : '#f6efdf';
      blob(ctx, r, x, y, R * (0.24 - i * 0.05) * s, 0.35);
      ctx.fill();
    }
  },
  ricotta(ctx, r, R, k) {
    const n = Math.round(8 * k);
    for (let i = 0; i < n; i++) {
      const [x, y] = inDisc(r, R * 0.66);
      ctx.fillStyle = '#fdfbf6';
      blob(ctx, r, x, y, R * (0.06 + r() * 0.035), 0.6);
      ctx.fill();
      ctx.fillStyle = 'rgba(220,210,190,0.6)';
      blob(ctx, r, x + R * 0.01, y + R * 0.012, R * 0.025, 0.6);
      ctx.fill();
    }
  },
  basilico(ctx, r, R, k) {
    const n = Math.round(6 * k);
    for (let i = 0; i < n; i++) {
      const [x, y] = inDisc(r, R * 0.6);
      const a = r() * Math.PI * 2;
      const L = R * (0.11 + r() * 0.04);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillStyle = '#2f6b2a';
      ctx.beginPath();
      ctx.moveTo(-L, 0);
      ctx.quadraticCurveTo(0, -L * 0.6, L, 0);
      ctx.quadraticCurveTo(0, L * 0.6, -L, 0);
      ctx.fill();
      ctx.strokeStyle = 'rgba(160,210,120,0.55)';
      ctx.lineWidth = R * 0.006;
      ctx.beginPath();
      ctx.moveTo(-L * 0.9, 0);
      ctx.lineTo(L * 0.9, 0);
      ctx.stroke();
      ctx.restore();
    }
  },
  olio(ctx, r, R, k) {
    ctx.strokeStyle = `rgba(214, 196, 60, ${0.5 * k})`;
    ctx.lineWidth = R * 0.012;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const a0 = r() * Math.PI * 2;
      ctx.arc(0, 0, R * (0.25 + i * 0.15), a0, a0 + k * 1.6);
      ctx.stroke();
    }
  },
  funghi(ctx, r, R, k) {
    const n = Math.round(10 * k);
    for (let i = 0; i < n; i++) {
      const [x, y] = inDisc(r, R * 0.66);
      const s = R * (0.07 + r() * 0.03);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r() * Math.PI * 2);
      ctx.fillStyle = '#8a6646';
      ctx.beginPath();
      ctx.arc(0, -s * 0.2, s, Math.PI, 0);
      ctx.quadraticCurveTo(s * 0.4, s * 0.1, s * 0.25, s * 0.9);
      ctx.lineTo(-s * 0.25, s * 0.9);
      ctx.quadraticCurveTo(-s * 0.4, s * 0.1, -s, -s * 0.2);
      ctx.fill();
      ctx.fillStyle = '#c4a27c';
      ctx.beginPath();
      ctx.arc(0, -s * 0.2, s * 0.7, Math.PI, 0);
      ctx.fill();
      ctx.restore();
    }
  },
  salsiccia(ctx, r, R, k) {
    const n = Math.round(14 * k);
    for (let i = 0; i < n; i++) {
      const [x, y] = inDisc(r, R * 0.68);
      ctx.fillStyle = r() > 0.5 ? '#8a3b22' : '#a24a2b';
      blob(ctx, r, x, y, R * (0.035 + r() * 0.025), 0.7);
      ctx.fill();
    }
  },
  pancetta(ctx, r, R, k) {
    const n = Math.round(7 * k);
    for (let i = 0; i < n; i++) {
      const [x, y] = inDisc(r, R * 0.6);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r() * Math.PI);
      const w = R * 0.2;
      const h = R * 0.05;
      ctx.fillStyle = '#d97a6a';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = '#f4ddd0';
      ctx.fillRect(-w / 2, -h * 0.1, w, h * 0.25);
      ctx.restore();
    }
  },
  castagne(ctx, r, R, k) {
    const n = Math.round(9 * k);
    for (let i = 0; i < n; i++) {
      const [x, y] = inDisc(r, R * 0.64);
      ctx.fillStyle = '#7a4a2a';
      blob(ctx, r, x, y, R * (0.045 + r() * 0.02), 0.5);
      ctx.fill();
      ctx.fillStyle = '#c99a62';
      blob(ctx, r, x - R * 0.01, y - R * 0.01, R * 0.025, 0.5);
      ctx.fill();
    }
  },
  miele(ctx, r, R, k) {
    ctx.strokeStyle = 'rgba(232, 169, 42, 0.8)';
    ctx.lineWidth = R * 0.016;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const turns = 2.2 * k;
    for (let a = 0; a <= turns * Math.PI * 2; a += 0.1) {
      const rr = R * 0.12 + (a / (Math.PI * 2)) * R * 0.22;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  },
  mortadella(ctx, r, R, k) {
    const n = Math.round(6 * k);
    for (let i = 0; i < n; i++) {
      const a = (i / 6) * Math.PI * 2 + r() * 0.3;
      const x = Math.cos(a) * R * 0.45;
      const y = Math.sin(a) * R * 0.45;
      ctx.fillStyle = '#eba7a2';
      blob(ctx, r, x, y, R * 0.17, 0.3);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (let j = 0; j < 4; j++) {
        ctx.beginPath();
        ctx.arc(x + (r() - 0.5) * R * 0.16, y + (r() - 0.5) * R * 0.16, R * 0.012, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
  pistacchio(ctx, r, R, k) {
    const n = Math.round(90 * k);
    for (let i = 0; i < n; i++) {
      const [x, y] = inDisc(r, R * 0.6);
      ctx.fillStyle = r() > 0.4 ? '#8fae3a' : '#b7c96a';
      ctx.fillRect(x, y, R * 0.022, R * 0.018);
    }
  },
  alici(ctx, r, R, k) {
    const n = Math.round(6 * k);
    for (let i = 0; i < n; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      ctx.save();
      ctx.translate(Math.cos(a) * R * 0.38, Math.sin(a) * R * 0.38);
      ctx.rotate(a + Math.PI / 2);
      const L = R * 0.2;
      const g = ctx.createLinearGradient(0, -R * 0.03, 0, R * 0.03);
      g.addColorStop(0, '#9c8f86');
      g.addColorStop(0.5, '#e3ded8');
      g.addColorStop(1, '#5b4d44');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, L / 2, R * 0.028, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },
  limone(ctx, r, R, k) {
    const n = Math.round(22 * k);
    ctx.strokeStyle = '#f2d33a';
    ctx.lineWidth = R * 0.012;
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const [x, y] = inDisc(r, R * 0.62);
      const a = r() * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(a) * R * 0.03, y + Math.sin(a) * R * 0.05, x + Math.cos(a) * R * 0.07, y + Math.sin(a) * R * 0.03);
      ctx.stroke();
    }
  },
  ficodindia(ctx, r, R, k) {
    const n = Math.round(7 * k);
    for (let i = 0; i < n; i++) {
      const [x, y] = inDisc(r, R * 0.58);
      ctx.fillStyle = r() > 0.5 ? '#e0662f' : '#c8395f';
      blob(ctx, r, x, y, R * 0.075, 0.25);
      ctx.fill();
      ctx.fillStyle = 'rgba(40,20,20,0.55)';
      for (let j = 0; j < 5; j++) {
        ctx.beginPath();
        ctx.arc(x + (r() - 0.5) * R * 0.08, y + (r() - 0.5) * R * 0.08, R * 0.007, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
  crudo(ctx, r, R, k) {
    const n = Math.round(5 * k);
    for (let i = 0; i < n; i++) {
      const [x, y] = inDisc(r, R * 0.5);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r() * Math.PI);
      ctx.fillStyle = 'rgba(214, 120, 118, 0.85)';
      ctx.beginPath();
      ctx.moveTo(-R * 0.14, 0);
      ctx.bezierCurveTo(-R * 0.05, -R * 0.09, R * 0.05, R * 0.09, R * 0.14, 0);
      ctx.bezierCurveTo(R * 0.05, R * 0.03, -R * 0.05, R * 0.15, -R * 0.14, 0);
      ctx.fill();
      ctx.restore();
    }
  },
  pecorino(ctx, r, R, k) {
    const n = Math.round(40 * k);
    ctx.fillStyle = '#efe6c8';
    for (let i = 0; i < n; i++) {
      const [x, y] = inDisc(r, R * 0.66);
      ctx.fillRect(x, y, R * 0.02, R * 0.008);
    }
  },
  origano(ctx, r, R, k) {
    const n = Math.round(60 * k);
    ctx.fillStyle = '#5c7a33';
    for (let i = 0; i < n; i++) {
      const [x, y] = inDisc(r, R * 0.68);
      ctx.fillRect(x, y, R * 0.01, R * 0.01);
    }
  },
  pepe(ctx, r, R, k) {
    const n = Math.round(50 * k);
    ctx.fillStyle = '#1b1715';
    for (let i = 0; i < n; i++) {
      const [x, y] = inDisc(r, R * 0.68);
      ctx.fillRect(x, y, R * 0.012, R * 0.012);
    }
  },
};

const baseColor = {
  rossa: ['#c4381f', '#9e2a15'],
  bianca: ['#f2e6cc', '#e2cfa8'],
  crema: ['#9c6a44', '#7e5233'],
};

/** Disegna la pizza centrata in (cx, cy) con raggio R. */
export function drawPizza(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, spec: PizzaSpec, t = 1) {
  const seed = spec.seed ?? 7;
  ctx.save();
  ctx.translate(cx, cy);

  // 1. Impasto che si allarga, con il cornicione irregolare.
  const doughK = easeOut(seg(t, 0, 0.22));
  if (doughK <= 0) {
    ctx.restore();
    return;
  }
  const r0 = rng(seed);
  const rr = R * (0.45 + 0.55 * doughK);
  ctx.beginPath();
  const pts = 48;
  const wob = Array.from({ length: pts }, () => 0.97 + r0() * 0.05);
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const d = rr * wob[i % pts];
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const crust = ctx.createRadialGradient(0, 0, rr * 0.55, 0, 0, rr);
  crust.addColorStop(0, '#f0d29a');
  crust.addColorStop(0.75, '#e2ae68');
  crust.addColorStop(0.92, '#c7843f');
  crust.addColorStop(1, '#8f5326');
  ctx.fillStyle = crust;
  ctx.fill();

  // Leopardatura: le macchie scure del forno a legna sul cornicione.
  const bake = seg(t, 0.85, 1);
  const r1 = rng(seed + 11);
  const spots = 34;
  for (let i = 0; i < spots; i++) {
    const a = r1() * Math.PI * 2;
    const d = rr * (0.84 + r1() * 0.13);
    ctx.fillStyle = `rgba(42, 22, 12, ${(0.25 + r1() * 0.5) * (0.35 + 0.65 * bake)})`;
    blob(ctx, r1, Math.cos(a) * d, Math.sin(a) * d, rr * (0.018 + r1() * 0.03), 0.6);
    ctx.fill();
  }

  // 2. Base: pomodoro, fiordilatte o crema, stesa a spirale.
  const baseK = easeOut(seg(t, 0.18, 0.38));
  if (baseK > 0) {
    const [c1, c2] = baseColor[spec.base];
    const br = rr * 0.8 * baseK;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, br);
    g.addColorStop(0, c1);
    g.addColorStop(0.85, c2);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    blob(ctx, rng(seed + 3), 0, 0, br, 0.08);
    ctx.fill();
  }

  // 3. Condimenti, uno strato dopo l'altro.
  const layers = spec.draw;
  const span = 0.55 / Math.max(1, layers.length);
  layers.forEach((name, i) => {
    const k = seg(t, 0.38 + i * span, 0.38 + (i + 1) * span);
    const paint = toppings[name];
    if (paint && k > 0) paint(ctx, rng(seed + 100 + i * 17), rr, k);
  });

  // Lucentezza leggera a cottura finita.
  if (bake > 0) {
    const shine = ctx.createRadialGradient(-rr * 0.3, -rr * 0.35, 0, -rr * 0.3, -rr * 0.35, rr * 0.9);
    shine.addColorStop(0, `rgba(255, 240, 210, ${0.16 * bake})`);
    shine.addColorStop(1, 'rgba(255, 240, 210, 0)');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.arc(0, 0, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

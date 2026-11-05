// Cenere che scende e braci che salgono nella hero. Il puntatore lascia una scia di scintille.

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  max: number;
  ember: boolean;
  trail?: boolean;
}

export function initEmbers(canvas: HTMLCanvasElement, animate: boolean) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  let particles: Particle[] = [];
  let running = false;
  let raf = 0;
  let lastWidth = -1;

  const spawn = (ember: boolean, x?: number, y?: number): Particle => {
    const max = ember ? 180 + Math.random() * 220 : 600 + Math.random() * 600;
    return {
      x: x ?? Math.random() * w,
      y: y ?? (ember ? h + Math.random() * 40 : Math.random() * h),
      vx: (Math.random() - 0.5) * (ember ? 0.6 : 0.25),
      vy: ember ? -(0.4 + Math.random() * 1.1) : 0.12 + Math.random() * 0.3,
      r: ember ? 0.8 + Math.random() * 1.8 : 0.6 + Math.random() * 1.4,
      life: x === undefined ? Math.random() * max : 0,
      max,
      ember,
    };
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Su mobile la barra degli indirizzi cambia l'altezza durante lo scroll: rigenera solo se cambia la larghezza.
    if (w !== lastWidth) {
      lastWidth = w;
      const count = Math.min(160, Math.round((w * h) / 9000));
      particles = Array.from({ length: count }, (_, i) => spawn(i % 4 === 0));
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++;
      p.x += p.vx + Math.sin((p.life + i) * 0.02) * (p.ember ? 0.35 : 0.15);
      p.y += p.vy;
      const t = p.life / p.max;
      if (t >= 1 || p.y < -20 || p.y > h + 20) {
        if (p.trail) particles.splice(i, 1); // le scintille del puntatore non si rigenerano
        else particles[i] = spawn(p.ember);
        continue;
      }
      const fade = Math.sin(Math.PI * Math.min(t, 1));
      if (p.ember) {
        const flicker = 0.6 + Math.random() * 0.4;
        ctx.fillStyle = `rgba(255, ${120 + Math.round(60 * (1 - t))}, 47, ${0.85 * fade * flicker})`;
        ctx.shadowColor = 'rgba(255, 122, 47, 0.9)';
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = `rgba(190, 180, 172, ${0.28 * fade})`;
        ctx.shadowBlur = 0;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  };

  const loop = () => {
    draw();
    raf = requestAnimationFrame(loop);
  };

  const start = () => {
    if (running || !animate) return;
    running = true;
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  resize();
  if (!animate) {
    draw();
  } else {
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(canvas);
    let last = 0;
    canvas.parentElement?.addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (now - last < 30 || particles.length > 260) return;
      last = now;
      const rect = canvas.getBoundingClientRect();
      for (let k = 0; k < 2; k++) {
        const p = spawn(true, e.clientX - rect.left, e.clientY - rect.top);
        p.max = 60 + Math.random() * 60;
        p.vy = -(0.6 + Math.random() * 1.2);
        p.vx = (Math.random() - 0.5) * 1.4;
        p.trail = true;
        particles.push(p);
      }
    });
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resize();
      if (!animate) draw();
    }, 150);
  });
}

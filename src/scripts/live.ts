// Dati che cambiano nel tempo: lievitazione, apertura del locale, meteo, stagione.
import { site } from '../config/site';
import { seasonOf } from '../data/terra';

const TZ = 'Europe/Rome';
const dayNames = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

function romeNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    month: 'numeric',
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  const minutes = (Number(get('hour')) % 24) * 60 + Number(get('minute'));
  return { day, minutes, month: Number(get('month')) };
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h === 0 && m === 0 ? 24 * 60 : h * 60 + m;
};

export function openState() {
  const { day, minutes } = romeNow();
  const today = site.hours[day] ?? [];
  for (const [a, b] of today) {
    if (minutes >= toMin(a) && minutes < toMin(b)) return { open: true, text: `Forno acceso · fino alle ${b}` };
  }
  const later = today.find(([a]) => toMin(a) > minutes);
  if (later) return { open: false, text: `Forno spento · si accende alle ${later[0]}` };
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const slots = site.hours[d] ?? [];
    if (slots.length) {
      const when = i === 1 ? 'domani' : dayNames[d];
      return { open: false, text: `Forno spento · riapre ${when} alle ${slots[0][0]}` };
    }
  }
  return { open: false, text: 'Orari in aggiornamento' };
}

export function initOpenStatus() {
  const { day } = romeNow();
  const state = openState();
  document.querySelectorAll<HTMLElement>('[data-live-status], [data-open-status]').forEach((el) => (el.textContent = state.text));
  document.querySelectorAll('.dot[data-open-dot], .cenere__live .dot').forEach((el) => el.classList.toggle('is-closed', !state.open));
  document.querySelector(`.hours tr[data-day="${day}"]`)?.classList.add('is-today');
}

export function initImpasto() {
  const card = document.querySelector<HTMLElement>('[data-impasto]');
  if (!card) return;
  const days = Number(card.dataset.days ?? 2);
  const hour = Number(card.dataset.hour ?? 10);
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(hour, 0, 0, 0);
  const hEl = card.querySelector('[data-impasto-h]');
  const mEl = card.querySelector('[data-impasto-m]');
  const tick = () => {
    const diff = Math.max(0, Date.now() - start.getTime());
    const h = Math.floor(diff / 3.6e6);
    const m = Math.floor((diff % 3.6e6) / 6e4);
    if (hEl) hEl.textContent = String(h);
    if (mEl) mEl.textContent = String(m).padStart(2, '0');
  };
  tick();
  setInterval(tick, 30_000);
}

export function initSeason() {
  const { month } = romeNow();
  const season = seasonOf(month);
  document.querySelectorAll('[data-season-label]').forEach((el) => (el.textContent = season));
  document.querySelectorAll<HTMLElement>('[data-pizza]').forEach((el) => {
    const seasons = (el.dataset.seasons ?? '').split(' ').filter(Boolean);
    el.classList.toggle('is-season', seasons.includes(season));
  });
  document.querySelector(`.calendar__months li[data-month="${month}"]`)?.classList.add('is-now');
}

// Meteo da Open-Meteo (gratuito, senza chiave, nessun cookie). Se non risponde resta il testo di riserva.
export async function initMeteo() {
  const coast = { lat: 37.7289, lon: 15.1844, elevation: 30 }; // Giarre
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${site.address.lat},${coast.lat}&longitude=${site.address.lon},${coast.lon}` +
    `&elevation=${site.address.altitude},${coast.elevation}&current=temperature_2m&timezone=${encodeURIComponent(TZ)}`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const [milo, giarre] = Array.isArray(data) ? data : [data];
    const tMilo = Math.round(milo?.current?.temperature_2m);
    const tCoast = Math.round(giarre?.current?.temperature_2m);
    if (!Number.isFinite(tMilo)) return;

    const set = (sel: string, v: string) => document.querySelectorAll(sel).forEach((el) => (el.textContent = v));
    document.querySelector('[data-meteo-pair]')?.removeAttribute('hidden');
    set('[data-temp-milo]', `${tMilo}°`);
    if (Number.isFinite(tCoast)) set('[data-temp-coast]', `${tCoast}°`);
    set('[data-live-temp]', `Milo ${tMilo}°`);

    const diff = tCoast - tMilo;
    let line: string;
    if (Number.isFinite(diff) && diff >= 2) line = `Quassù ci sono ${diff} gradi in meno che sulla costa. L'aria buona è compresa.`;
    else if (tMilo <= 12) line = 'Fuori fa fresco, dentro c\'è il forno a 450 gradi.';
    else line = 'Una serata giusta per salire in montagna.';
    set('[data-meteo-line]', line);
  } catch {
    /* testo di riserva già presente nella pagina */
  }
}

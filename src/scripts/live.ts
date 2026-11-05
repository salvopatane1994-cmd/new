// Orari del forno, stato aperto/chiuso e orari di ritiro, sempre nel fuso orario di Roma.
import { site } from '../config/site';
import { seasonOf } from '../data/terra';

const TZ = 'Europe/Rome';
const dayNames = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

export function romeNow() {
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
const toHHMM = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const dayWord = (offset: number, day: number) => (offset === 0 ? 'oggi' : offset === 1 ? 'domani' : dayNames[day]);

export interface Slot { value: string; label: string }

/** Orari di ritiro: oggi se c'è ancora tempo, altrimenti il prossimo giorno di apertura. */
export function pickupSlots(): Slot[] {
  const { day, minutes } = romeNow();
  for (let offset = 0; offset < 8; offset++) {
    const d = (day + offset) % 7;
    const slots: Slot[] = [];
    for (const [a, b] of site.hours[d] ?? []) {
      const earliest = offset === 0 ? Math.max(toMin(a) + site.slotMinutes, minutes + site.prepMinutes) : toMin(a) + site.slotMinutes;
      let t = Math.ceil(earliest / site.slotMinutes) * site.slotMinutes;
      for (; t <= toMin(b) - site.slotMinutes; t += site.slotMinutes) {
        const when = dayWord(offset, d);
        slots.push({ value: `${when} alle ${toHHMM(t)}`, label: `${when[0].toUpperCase()}${when.slice(1)} · ${toHHMM(t)}` });
      }
    }
    if (slots.length) return slots;
  }
  return [];
}

export function openState() {
  const { day, minutes } = romeNow();
  const today = site.hours[day] ?? [];
  const first = pickupSlots()[0];
  for (const [a, b] of today) {
    if (minutes >= toMin(a) && minutes < toMin(b)) {
      return {
        open: true,
        text: `Forno acceso · ordini fino alle ${b}`,
        short: first ? `Forno acceso · ritiro dalle ${first.value.split(' alle ')[1]}` : 'Forno acceso',
      };
    }
  }
  const later = today.find(([a]) => toMin(a) > minutes);
  if (later) return { open: false, text: `Forno spento · si accende alle ${later[0]}`, short: `Si accende alle ${later[0]}` };
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const slots = site.hours[d] ?? [];
    if (slots.length) {
      const when = dayWord(i, d);
      return { open: false, text: `Forno spento · riapre ${when} alle ${slots[0][0]}`, short: `Ordini per ${when}, dalle ${slots[0][0]}` };
    }
  }
  return { open: false, text: 'Orari in aggiornamento', short: 'Orari in aggiornamento' };
}

export function initLive() {
  const { day, month } = romeNow();
  const state = openState();
  document.querySelectorAll('[data-open-status]').forEach((el) => (el.textContent = state.text));
  document.querySelectorAll('[data-open-short]').forEach((el) => (el.textContent = state.short));
  document.querySelectorAll('[data-open-dot]').forEach((el) => el.classList.toggle('is-closed', !state.open));
  document.querySelector(`tr[data-day="${day}"]`)?.classList.add('is-today');

  const season = seasonOf(month);
  document.querySelectorAll<HTMLElement>('[data-item]').forEach((el) => {
    el.classList.toggle('is-season', (el.dataset.seasons ?? '').split(' ').includes(season));
  });
}

// Ordine da asporto: si compone sul sito e parte già scritto su WhatsApp.
import { site } from '../config/site';
import { pizzas, wines } from '../data/terra';
import { pickupSlots } from './live';

interface Product { id: string; name: string; price: number; kind: 'pizza' | 'vino' }

const catalogue: Product[] = [
  ...pizzas.map((p) => ({ id: p.id, name: p.name, price: p.price, kind: 'pizza' as const })),
  ...wines.map((w) => ({ id: `vino-${w.id}`, name: w.name, price: w.price, kind: 'vino' as const })),
];
const byId = new Map(catalogue.map((p) => [p.id, p]));
const KEY = 'ordine-720';
const euro = (n: number) => `€ ${n.toLocaleString('it-IT')}`;

function load(): Map<string, number> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Map();
    const entries = (JSON.parse(raw) as [string, number][]).filter(([id, q]) => byId.has(id) && q > 0);
    return new Map(entries);
  } catch {
    return new Map();
  }
}
function save(cart: Map<string, number>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...cart]));
  } catch {
    /* archiviazione non disponibile: l'ordine resta in pagina */
  }
}

export function initOrder() {
  const cart = load();
  const bar = document.querySelector<HTMLButtonElement>('[data-open-order]');
  const barLabel = document.querySelector('[data-bar-label]');
  const sheet = document.querySelector<HTMLDialogElement>('[data-sheet]');
  const lines = document.querySelector<HTMLUListElement>('[data-lines]');
  const empty = document.querySelector<HTMLElement>('[data-empty]');
  const total = document.querySelector('[data-total]');
  const send = document.querySelector<HTMLAnchorElement>('[data-send]');
  const time = document.querySelector<HTMLSelectElement>('[data-time]');
  const name = document.querySelector<HTMLInputElement>('[data-name]');
  const note = document.querySelector<HTMLInputElement>('[data-note]');

  const count = () => [...cart.values()].reduce((a, b) => a + b, 0);
  const sum = () => [...cart].reduce((a, [id, q]) => a + (byId.get(id)?.price ?? 0) * q, 0);

  const message = () => {
    const rows = [...cart].map(([id, q]) => {
      const p = byId.get(id)!;
      return `${q}× ${p.kind === 'vino' ? `${p.name} (bottiglia)` : p.name} — ${euro(p.price * q)}`;
    });
    const parts = [`Ciao ${site.name}! Vorrei ordinare da asporto:`, '', ...rows, '', `Totale: ${euro(sum())}`];
    if (time?.value) parts.push(`Ritiro: ${time.value}`);
    if (name?.value.trim()) parts.push(`Nome: ${name.value.trim()}`);
    if (note?.value.trim()) parts.push(`Note: ${note.value.trim()}`);
    return parts.join('\n');
  };

  const refreshSend = () => {
    if (!send) return;
    const ok = cart.size > 0;
    send.classList.toggle('is-disabled', !ok);
    send.setAttribute('aria-disabled', String(!ok));
    send.href = ok ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message())}` : '#';
  };

  const render = () => {
    // Pulsanti del menu e delle bottiglie
    document.querySelectorAll<HTMLButtonElement>('[data-add]').forEach((btn) => {
      const q = cart.get(btn.dataset.add!) ?? 0;
      btn.classList.toggle('in-cart', q > 0);
      const label = btn.querySelector('[data-add-label]');
      if (label) label.textContent = q > 0 ? `Nell'ordine · ${q}` : 'Aggiungi';
    });
    document.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach((btn) => {
      btn.hidden = !cart.get(btn.dataset.remove!);
    });

    // Barra in basso
    const n = count();
    if (barLabel) barLabel.textContent = n ? `Ordine · ${n} · ${euro(sum())}` : 'Ordina';
    bar?.classList.toggle('has-items', n > 0);

    // Pannello
    if (lines) {
      lines.replaceChildren(
        ...[...cart].map(([id, q]) => {
          const p = byId.get(id)!;
          const li = document.createElement('li');
          li.innerHTML = `
            <span class="ln-name"></span>
            <span class="stepper">
              <button type="button" data-step="-1" aria-label="Togli">−</button>
              <span>${q}</span>
              <button type="button" data-step="1" aria-label="Aggiungi">+</button>
            </span>
            <span class="ln-price">${euro(p.price * q)}</span>`;
          li.querySelector('.ln-name')!.textContent = p.kind === 'vino' ? `${p.name} · bottiglia` : p.name;
          li.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((b) =>
            b.addEventListener('click', () => change(id, Number(b.dataset.step))),
          );
          return li;
        }),
      );
    }
    if (empty) empty.hidden = cart.size > 0;
    if (total) total.textContent = euro(sum());
    refreshSend();
  };

  const change = (id: string, delta: number) => {
    const q = Math.max(0, (cart.get(id) ?? 0) + delta);
    if (q) cart.set(id, q);
    else cart.delete(id);
    save(cart);
    render();
    if (delta > 0 && bar) {
      bar.classList.remove('bump');
      void bar.offsetWidth;
      bar.classList.add('bump');
    }
  };

  document.querySelectorAll<HTMLButtonElement>('[data-add]').forEach((b) => b.addEventListener('click', () => change(b.dataset.add!, 1)));
  document.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach((b) => b.addEventListener('click', () => change(b.dataset.remove!, -1)));

  const fillSlots = () => {
    if (!time) return;
    const slots = pickupSlots();
    const prev = time.value;
    time.replaceChildren(
      ...slots.map((s) => {
        const o = document.createElement('option');
        o.value = s.value;
        o.textContent = s.label;
        return o;
      }),
    );
    if (slots.some((s) => s.value === prev)) time.value = prev;
  };

  bar?.addEventListener('click', () => {
    if (!cart.size) {
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    fillSlots();
    render();
    if (sheet?.showModal) sheet.showModal();
    else sheet?.setAttribute('open', '');
  });
  sheet?.addEventListener('click', (e) => {
    if (e.target === sheet) sheet.close(); // tocco fuori dal pannello
  });
  [time, name, note].forEach((el) => el?.addEventListener('input', refreshSend));

  fillSlots();
  render();
}

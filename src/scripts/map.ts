// Collega il menu alla mappa: una pizza accende i paesi dei suoi ingredienti, un paese accende i suoi prodotti.
import { ingredients, places, pizzas } from '../data/terra';

export function initMap() {
  const map = document.querySelector('[data-map]');
  const legend = document.querySelector('[data-map-legend]');
  if (!map || !legend) return;

  const placeName = (id: string) => places.find((p) => p.id === id)?.name ?? id;
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-pizza]'));
  const placeEls = Array.from(map.querySelectorAll<SVGGElement>('[data-place]'));
  const routes = Array.from(map.querySelectorAll<SVGPathElement>('[data-route]'));

  const light = (ingIds: string[]) => {
    routes.forEach((r) => r.classList.toggle('is-on', ingIds.includes(r.dataset.route ?? '')));
    placeEls.forEach((p) => {
      const ings = (p.dataset.ings ?? '').split(' ');
      p.classList.toggle('is-on', ings.some((i) => ingIds.includes(i)));
    });
  };

  const showPizza = (el: HTMLElement) => {
    items.forEach((i) => i.classList.toggle('is-active', i === el));
    const pizza = pizzas.find((p) => p.id === el.dataset.pizza);
    if (!pizza) return;
    light(pizza.origins);
    if (!pizza.origins.length) {
      legend.textContent = `${pizza.name}: la classica. Pomodoro, fiordilatte e basilico, nessuna mappa necessaria.`;
      return;
    }
    const parts = pizza.origins.map((id) => {
      const ing = ingredients.find((i) => i.id === id)!;
      return `${ing.name} da ${placeName(ing.origin)}`;
    });
    legend.textContent = `${pizza.name}: ${parts.join(', ')}.`;
  };

  const showPlace = (el: SVGGElement) => {
    const ingIds = (el.dataset.ings ?? '').split(' ').filter(Boolean);
    light(ingIds);
    items.forEach((i) => i.classList.remove('is-active'));
    const ings = ingIds.map((id) => ingredients.find((i) => i.id === id)!).filter(Boolean);
    legend.textContent = `${placeName(el.dataset.place ?? '')}: ${ings.map((i) => `${i.name}. ${i.note}`).join(' ')}`;
  };

  items.forEach((el) => {
    el.addEventListener('mouseenter', () => showPizza(el));
    el.addEventListener('focus', () => showPizza(el));
    el.addEventListener('click', () => showPizza(el));
  });
  placeEls.forEach((el) => {
    el.addEventListener('mouseenter', () => showPlace(el));
    el.addEventListener('click', () => showPlace(el));
  });

  // Stato iniziale: la prima pizza di stagione, così la mappa non parte vuota.
  const first = items.find((i) => i.classList.contains('is-season') && i.dataset.origins) ?? items.find((i) => i.dataset.origins);
  if (first) showPizza(first);
}

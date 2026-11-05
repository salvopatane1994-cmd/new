// Ingredienti, luoghi di provenienza e menu di esempio.
// Le provenienze sono plausibili per il territorio, ma i produttori vanno confermati con il cliente.

export type Season = 'inverno' | 'primavera' | 'estate' | 'autunno';

export interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface Ingredient {
  id: string;
  name: string;
  origin: string; // id di Place
  note: string;
  months: number[]; // 1-12, mesi di stagione; vuoto = tutto l'anno
}

export interface Pizza {
  id: string;
  name: string;
  meaning: string;
  ingredients: string[]; // testo mostrato nel menu
  origins: string[]; // id di Ingredient legati alla mappa
  price: number;
  seasons: Season[]; // vuoto = sempre in carta
  wine: string; // id di Wine
}

export const places: Place[] = [
  { id: 'milo', name: 'Milo', lat: 37.7238, lon: 15.116 },
  { id: 'bronte', name: 'Bronte', lat: 37.789, lon: 14.833 },
  { id: 'linguaglossa', name: 'Linguaglossa', lat: 37.842, lon: 15.142 },
  { id: 'santalfio', name: "Sant'Alfio", lat: 37.744, lon: 15.139 },
  { id: 'zafferana', name: 'Zafferana Etnea', lat: 37.693, lon: 15.105 },
  { id: 'acireale', name: 'Acireale', lat: 37.612, lon: 15.166 },
  { id: 'biancavilla', name: 'Biancavilla', lat: 37.645, lon: 14.866 },
  { id: 'maletto', name: 'Maletto', lat: 37.83, lon: 14.866 },
  { id: 'riposto', name: 'Riposto', lat: 37.732, lon: 15.205 },
];

export const ingredients: Ingredient[] = [
  { id: 'pistacchio', name: 'Pistacchio Verde di Bronte DOP', origin: 'bronte', note: 'Sulle sciare del versante ovest.', months: [9, 10] },
  { id: 'funghi', name: 'Funghi dei boschi', origin: 'linguaglossa', note: 'Pinete e faggete del versante nord.', months: [9, 10, 11] },
  { id: 'castagne', name: 'Castagne', origin: 'santalfio', note: 'Il paese del Castagno dei Cento Cavalli.', months: [10, 11, 12] },
  { id: 'miele', name: 'Miele di zagara e castagno', origin: 'zafferana', note: 'La città del miele, a dieci minuti.', months: [4, 5, 6, 7] },
  { id: 'limone', name: "Limone dell'Etna IGP", origin: 'acireale', note: 'Agrumeti tra lava e mare.', months: [] },
  { id: 'ficodindia', name: "Ficodindia dell'Etna DOP", origin: 'biancavilla', note: 'Il frutto di fine estate del versante sud-ovest.', months: [8, 9, 10, 11] },
  { id: 'ricotta', name: 'Ricotta di pecora', origin: 'maletto', note: 'Dai pascoli alti del versante nord-ovest.', months: [] },
  { id: 'alici', name: 'Alici', origin: 'riposto', note: 'Il porto di pesca più vicino.', months: [3, 4, 5, 6, 7, 8, 9] },
  { id: 'salsiccia', name: 'Salsiccia al finocchietto', origin: 'milo', note: 'Macelleria del paese, da definire.', months: [] },
  { id: 'carricante', name: 'Carricante', origin: 'milo', note: "L'uva dell'Etna Bianco Superiore.", months: [9, 10] },
];

export const pizzas: Pizza[] = [
  {
    id: 'belvedere',
    name: 'Belvedere',
    meaning: 'La piazza di Milo che guarda il mare.',
    ingredients: ['pomodoro', 'fiordilatte', 'basilico', 'olio extravergine'],
    origins: [],
    price: 8,
    seasons: [],
    wine: 'bianco-superiore',
  },
  {
    id: 'valle-del-bove',
    name: 'Valle del Bove',
    meaning: 'La grande caldera che si apre sopra Milo.',
    ingredients: ['fiordilatte', 'funghi dei boschi', 'salsiccia al finocchietto', 'pecorino'],
    origins: ['funghi', 'salsiccia'],
    price: 12,
    seasons: ['autunno'],
    wine: 'rosso',
  },
  {
    id: 'cento-cavalli',
    name: 'Cento Cavalli',
    meaning: "Il castagno millenario di Sant'Alfio.",
    ingredients: ['crema di castagne', 'provola affumicata', 'pancetta', 'miele'],
    origins: ['castagne', 'miele'],
    price: 13,
    seasons: ['autunno', 'inverno'],
    wine: 'rosso',
  },
  {
    id: 'verde-bronte',
    name: 'Verde',
    meaning: 'Il colore del pistacchio sulle sciare.',
    ingredients: ['mortadella', 'burrata', 'pesto e granella di pistacchio'],
    origins: ['pistacchio'],
    price: 14,
    seasons: [],
    wine: 'spumante',
  },
  {
    id: 'riviera',
    name: 'Riviera',
    meaning: 'La costa dei limoni, giù verso il mare.',
    ingredients: ['ricotta', 'alici', 'scorza di limone', 'origano'],
    origins: ['limone', 'alici', 'ricotta'],
    price: 12,
    seasons: ['primavera', 'estate'],
    wine: 'bianco-superiore',
  },
  {
    id: 'lapilli',
    name: 'Lapilli',
    meaning: 'Le piccole pietre che il vulcano lancia in aria.',
    ingredients: ['ficodindia', 'ricotta salata', 'crudo', 'pepe nero'],
    origins: ['ficodindia', 'ricotta'],
    price: 13,
    seasons: ['estate', 'autunno'],
    wine: 'rosato',
  },
];

export interface Wine {
  id: string;
  name: string;
  grapes: string;
  note: string;
}

export const wines: Wine[] = [
  {
    id: 'bianco-superiore',
    name: 'Etna Bianco Superiore',
    grapes: 'Carricante almeno 80%',
    note: 'Si produce soltanto nel comune di Milo.',
  },
  { id: 'rosso', name: 'Etna Rosso', grapes: 'Nerello Mascalese e Nerello Cappuccio', note: 'Il rosso del vulcano, teso e minerale.' },
  { id: 'rosato', name: 'Etna Rosato', grapes: 'Nerello Mascalese', note: 'Fresco, per le sere di fine estate.' },
  { id: 'spumante', name: 'Etna Spumante', grapes: 'Nerello Mascalese, metodo classico', note: 'Bollicine di montagna.' },
];

export function seasonOf(month: number): Season {
  if (month === 12 || month <= 2) return 'inverno';
  if (month <= 5) return 'primavera';
  if (month <= 8) return 'estate';
  return 'autunno';
}

// Proiezione semplice lat/lon -> coordinate della mappa SVG (cratere centrale in alto a sinistra del centro).
export const MAP = { width: 560, height: 520, summit: { lat: 37.751, lon: 14.995, x: 250, y: 200 }, scale: 12 };

export function project(lat: number, lon: number) {
  const x = MAP.summit.x + (lon - MAP.summit.lon) * 88 * MAP.scale;
  const y = MAP.summit.y - (lat - MAP.summit.lat) * 111 * MAP.scale;
  return { x: Math.round(x), y: Math.round(y) };
}

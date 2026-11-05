// "L'impasto di oggi": in produzione questi valori arrivano dal CMS e li aggiorna il pizzaiolo.
// Per il prototipo l'avvio della lievitazione è calcolato come "due giorni fa alle 10:00",
// così il contatore mostra sempre un valore realistico.

export const impasto = {
  startedDaysAgo: 2,
  startedAtHour: 10,
  flour: 'Tipo 1 macinata a pietra e 20% di grano duro siciliano',
  hydration: 72,
  ovenTemp: 450,
  bakeSeconds: 90,
  specials: [
    'Valle del Bove con porcini dei boschi di Linguaglossa',
    'Cento Cavalli con crema di castagne di Sant’Alfio',
    'Fuori menu: scacciata etnea, solo il sabato',
  ],
};

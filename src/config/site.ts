// Dati del locale. Il nome è provvisorio: cambiandolo qui si aggiorna tutto il sito.
// I campi segnati SEGNAPOSTO vanno sostituiti con i dati reali del cliente.

export const site = {
  name: 'Settecentoventi',
  shortName: '720',
  tagline: "Pizza d'altura",
  claim: 'Impasto, fuoco e terra del vulcano.',
  description:
    "Pizzeria a Milo, sul versante est dell'Etna, a 720 metri. Lunga lievitazione, forno a legna, ingredienti del vulcano e l'Etna Bianco Superiore che nasce solo qui.",
  url: 'https://www.settecentoventi.it', // SEGNAPOSTO
  locale: 'it_IT',

  address: {
    street: 'Piazza Belvedere', // SEGNAPOSTO
    city: 'Milo',
    province: 'CT',
    postalCode: '95010',
    country: 'IT',
    lat: 37.7238,
    lon: 15.116,
    altitude: 720,
  },

  phone: '+39 095 000 0000', // SEGNAPOSTO
  whatsapp: '390000000000', // SEGNAPOSTO, formato internazionale senza +
  email: 'ciao@settecentoventi.it', // SEGNAPOSTO
  bookingUrl: 'https://www.thefork.it/', // SEGNAPOSTO: link alla scheda TheFork o al sistema di prenotazione
  instagram: 'https://www.instagram.com/', // SEGNAPOSTO
  mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Milo+CT',

  // Orari settimanali. 0 = domenica. Ogni fascia è [apertura, chiusura] in ora locale.
  hours: {
    0: [['12:30', '15:00'], ['19:00', '23:30']],
    1: [],
    2: [['19:00', '23:30']],
    3: [['19:00', '23:30']],
    4: [['19:00', '23:30']],
    5: [['19:00', '00:00']],
    6: [['12:30', '15:00'], ['19:00', '00:00']],
  } as Record<number, [string, string][]>,

  // Tempi di percorrenza indicativi, da verificare.
  travel: [
    { from: 'Giarre', minutes: 20 },
    { from: 'Zafferana Etnea', minutes: 15 },
    { from: 'Acireale', minutes: 35 },
    { from: 'Catania', minutes: 50 },
  ],
};

export type Site = typeof site;

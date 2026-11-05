// Dati del locale. Il nome è provvisorio: cambiandolo qui si aggiorna tutto il sito.
// I campi segnati SEGNAPOSTO vanno sostituiti con i dati reali del cliente.

export const site = {
  name: 'Settecentoventi',
  shortName: '720',
  tagline: "Pizza d'altura da asporto",
  description:
    "Pizza da asporto a Milo, sul versante est dell'Etna, a 720 metri. Forno a legna, lunga lievitazione e ingredienti del vulcano. Ordina su WhatsApp e passa a ritirarla.",
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
  instagram: 'https://www.instagram.com/', // SEGNAPOSTO
  mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Milo+CT',

  // Asporto
  prepMinutes: 20, // primo orario di ritiro possibile da adesso
  slotMinutes: 15, // intervallo tra gli orari di ritiro

  // Orari del forno. 0 = domenica. Ogni fascia è [apertura, chiusura] in ora locale.
  hours: {
    0: [['18:30', '23:00']],
    1: [],
    2: [['18:30', '23:00']],
    3: [['18:30', '23:00']],
    4: [['18:30', '23:00']],
    5: [['18:30', '23:30']],
    6: [['18:30', '23:30']],
  } as Record<number, [string, string][]>,

  // Tempi di percorrenza indicativi, da verificare.
  travel: [
    { from: 'Fornazzo', minutes: 5 },
    { from: 'Zafferana Etnea', minutes: 15 },
    { from: "Sant'Alfio", minutes: 10 },
    { from: 'Giarre', minutes: 20 },
  ],
};

export type Site = typeof site;

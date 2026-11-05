# Settecentoventi · prototipo della homepage

Prototipo del sito per una nuova pizzeria a **Milo (CT)**, sul versante est dell'Etna, a 720 m.
Il nome «Settecentoventi» è **provvisorio** e si cambia da un solo file.

## Il concept: «Stratigrafia»

La homepage si legge scorrendo come una discesa negli strati della terra dell'Etna:

| # | Strato | Contenuto |
|---|--------|-----------|
| 01 | **Cenere** | Hero nera con cenere che cade e braci che salgono (il puntatore lascia scintille), stato del forno in tempo reale |
| 02 | **Fuoco** | Il forno che si accende scorrendo, numeri della cottura, card «L'impasto di oggi» con il contatore della lievitazione |
| 03 | **Terra** | Mappa dell'Etna con le curve di livello e la Valle del Bove: passando su una pizza si accendono i paesi da cui arrivano gli ingredienti; calendario stagionale |
| 04 | **Vigna** | Etna Bianco Superiore (si produce solo a Milo), abbinamenti pizza e vino, ViniMilo |
| 05 | **Tavola** | Meteo in tempo reale Milo e costa, stato aperto/chiuso, prenotazione, WhatsApp per l'asporto, orari, come arrivare |

Elementi che cambiano da soli:
- **Stagione**: colore d'accento, pizze «di stagione» e mese evidenziato nel calendario cambiano con la data.
- **Aperto o chiuso**: calcolato sugli orari, nel fuso orario di Roma.
- **Meteo**: temperatura attuale a Milo e a Giarre da [Open-Meteo](https://open-meteo.com) (gratuito, senza chiave e senza cookie). Se il servizio non risponde, resta una frase di riserva.
- **Lievitazione**: contatore delle ore dall'avvio dell'impasto.

## Avvio

Richiede Node.js 22.22 o successivo.

```bash
npm install
npm run dev      # sviluppo su http://localhost:4321
npm run build    # sito statico in dist/
npm run preview  # anteprima della build
```

`dist/` si pubblica su qualsiasi hosting statico (Netlify, Cloudflare Pages, Vercel).

## Dove si modificano i contenuti

| File | Cosa contiene |
|------|---------------|
| `src/config/site.ts` | Nome, indirizzo, telefono, WhatsApp, link di prenotazione, orari, tempi di percorrenza |
| `src/data/terra.ts` | Paesi sulla mappa, ingredienti e stagionalità, pizze, vini |
| `src/data/impasto.ts` | Farina, idratazione, temperatura del forno, fuori menu della sera |
| `src/data/strati.ts` | Nomi degli strati nell'indicatore laterale |

I valori segnati `SEGNAPOSTO` vanno sostituiti con i dati reali del cliente.

## Struttura

```
src/
  components/
    strati/        Cenere, Fuoco, Terra, Vigna, Superficie (le cinque sezioni)
    Edge.astro     confine a onde tra uno strato e l'altro
    DepthGauge     indicatore degli strati a sinistra (desktop)
    PhotoSlot      spazio per le foto reali, con il brief dello scatto
  scripts/
    main.ts        animazioni GSAP/ScrollTrigger, header, indicatore
    embers.ts      cenere e braci su canvas
    live.ts        stagione, apertura, meteo, lievitazione
    map.ts         collegamento menu e mappa
  styles/global.css  palette, tipografia, componenti comuni
```

## Scelte tecniche

- **Astro 7** genera HTML statico: la pagina si carica veloce anche su mobile in montagna. Il JavaScript serve solo alle animazioni e ai dati in tempo reale.
- **GSAP ScrollTrigger** per le animazioni legate allo scroll.
- **Font locali** (Fraunces e Manrope via Fontsource): nessuna richiesta a Google Fonts, quindi niente problemi di GDPR.
- **Accessibilità**: con `prefers-reduced-motion` le animazioni sono disattivate e tutto il contenuto resta visibile; la mappa ha titolo e descrizione testuale; menu navigabile da tastiera.
- **SEO locale**: dati strutturati Schema.org `Restaurant` con indirizzo, coordinate e orari.

## Prossimi passi

1. Nome definitivo, logo e servizio fotografico e video: ogni `PhotoSlot` contiene il brief dello scatto.
2. Menu, prezzi, produttori e cantine reali.
3. Collegare un CMS leggero (Sanity o Decap) per menu, eventi e «impasto di oggi».
4. Versione inglese, pagine Privacy e Cookie, link reale di prenotazione (TheFork o altro sistema).

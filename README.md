# Settecentoventi · prototipo del sito

Prototipo del sito per una nuova pizzeria **solo da asporto** a **Milo (CT)**, sul versante est dell'Etna, a 720 m.
Il nome «Settecentoventi» è **provvisorio** e si cambia da un solo file.

Pensato prima per lo smartphone: le azioni stanno in basso, a portata di pollice, e il sito serve a una cosa sola,
**far ordinare**.

## La pagina

| Sezione | Cosa succede |
|---------|--------------|
| **Dal cratere al forno** | La scena resta ferma sullo schermo e lo scroll muove la camera: l'Etna di notte con le luci di Milo, il tuffo nel cratere, la lava (1.100 °C), la lava che diventa fiamma, la bocca del forno dove entra la pizza e cuoce in 90 secondi. Un indicatore mostra la temperatura che cambia. |
| **Il menu** | Ogni pizza è disegnata in codice e si compone mentre sale nello schermo (impasto, base, condimenti, leopardatura del forno). Pulsante «Aggiungi» su ogni pizza. |
| **Da dove arriva** | Un ingrediente per volta, a tutto schermo, con la mappa dell'Etna che accende il paese di provenienza. |
| **Vino** | La frase sull'Etna Bianco Superiore si accende parola per parola; le bottiglie si aggiungono all'ordine. |
| **Ritiro** | Indirizzo, Maps, orari con il giorno corrente, tempi di percorrenza, telefono. |
| **Barra «Ordina»** | Sempre in basso. Mostra se il forno è acceso e il primo orario di ritiro; con pizze nel carrello diventa «Ordine · 3 · € 32» e apre il pannello. |
| **Pannello d'ordine** | Quantità, orario di ritiro (calcolato sugli orari del forno, fuso di Roma), nome, note. «Invia su WhatsApp» apre la chat con il messaggio già scritto. |

## Avvio

Richiede Node.js 22.22 o successivo.

```bash
npm install
npm run dev      # sviluppo su http://localhost:4321
npm run build    # sito statico in dist/
npm run preview  # anteprima della build
```

## Dove si modificano i contenuti

| File | Cosa contiene |
|------|---------------|
| `src/config/site.ts` | Nome, indirizzo, telefono, numero WhatsApp, orari del forno, minuti di preparazione, intervallo tra orari di ritiro |
| `src/data/terra.ts` | Pizze (prezzi, ingredienti, cosa disegnare), ingredienti e paesi della mappa, vini e prezzi delle bottiglie |

I valori segnati `SEGNAPOSTO` vanno sostituiti con i dati reali del cliente.

## Struttura

```
src/
  components/   Discesa (scena), Menu, Terra, Vino, Ritiro, Ordine (barra e pannello), TopBar, Fascia, Footer
  scripts/
    scene.ts    scena guidata dallo scroll: Etna, cratere, forno, testi e indicatore di temperatura
    lava.ts     shader WebGL per lava e fiamme, a risoluzione ridotta per restare fluido sui telefoni
    pizza.ts    disegno delle pizze viste dall'alto, costruite per strati
    order.ts    carrello, orari di ritiro, messaggio WhatsApp (il carrello resta salvato nel browser)
    live.ts     forno acceso o spento, orari di ritiro, pizze di stagione
    main.ts     un solo gestore dello scroll per menu, ingredienti, frase sul vino, fasce di testo
  styles/global.css  colori, tipografia, pulsanti
```

## Scelte tecniche

- **Astro 7**, sito statico. JavaScript totale circa 30 KB, nessuna libreria di animazione.
- **Fluido sui telefoni**: lo shader della lava gira a metà risoluzione, i canvas si fermano quando escono dallo schermo,
  le pizze vengono ridisegnate solo quando cambia lo stato.
- **Mobile first**: barra d'ordine fissa in basso, pulsanti da almeno 44 px, campi a 16 px (niente zoom automatico su iPhone),
  rispetto delle aree sicure di iPhone (`viewport-fit=cover`).
- **Accessibilità**: con «riduci movimento» attivo la scena non è guidata dallo scroll e tutto il contenuto resta visibile.
- **Font locali** (Archivo con asse di larghezza e IBM Plex Mono): nessuna richiesta a Google Fonts.
- **SEO locale**: dati strutturati Schema.org `Restaurant` con indirizzo, coordinate e orari.

## Prossimi passi

1. Nome definitivo e logo.
2. Shooting foto e video: le pizze vere possono sostituire o affiancare quelle disegnate, e un video del forno può chiudere la scena.
3. Menu, prezzi, produttori e numero WhatsApp reali.
4. Valutare un sistema di ordini con pagamento online quando i volumi lo giustificano.

# Notte 2026-11-04 — supernotify-cards (ramo notte/20261104)

## Fatto

Giro 1 (senza dipendenze, test non eseguibili):
- `db0920b` test: design_0752 conta i giorni di calendario, non passi di 24 h
- `b62d2d3` test: audit_fase1 BUG-6 risponde con la data di oggi
- `f41be67` test: design_085 tiene le notifiche finte dentro "oggi" dopo mezzanotte
- `76bddb5` docs: la card automazioni punta allo script del manifest in tools/

Giro 2:
- Suite completa eseguita: 63/63 file verdi sul codice di partenza; `node -c`, `tools/check_card_versions.py`,
  `py_compile` dei tools verdi.
- `e257688` NOTE_DA_IMPLEMENTARE voce 1.1 + 1.2: chiave `card` in `snPalette()` (fondo di `ha-card` da
  `--ha-card-background` con `style: theme`; con i colori SuperNotify `card = panel`, nessun cambio visivo),
  `style: auto` (`snStyle()`, ridisegno al cambio tema, voce "Automatica" nell'editor, già tradotta in tutte le
  lingue), test `tests/theme_style.test.mjs`, docs/configuration.md, CHANGELOG [Unreleased]. Suite 64/64 verde.
  Bordo, ombra e vetro (`backdrop-filter`) di `ha-card`: nessuna regola delle card li copre, restano quelli del tema.
- `9035e0a` voce 1.3: FAQ "La card ha un colore diverso" in docs/configuration.md (style theme/auto e l'insidia
  della vista con `theme: Backend-selected`).
- Voce 1.4 (parti "prodotto" a colori fissi): nessuna modifica, come da nota.
- NOTE_DA_IMPLEMENTARE.md (file locale nella cartella originale) non l'ho toccato: va segnata come fatta a mano.

Giro 3 (ripresa):
- Albero pulito all'avvio, nessun lavoro lasciato a metà.
- Suite completa eseguita due volte di fila sul ramo: 64/64 verde entrambe le volte (nessun test instabile
  ricomparso). `node -c dist/supernotify-control-card.js`, `tools/check_card_versions.py --base main`
  ("card versions OK"), `py_compile` dei tools e `hacs.json` verdi.
- NOTE_DA_IMPLEMENTARE.md: tutte le voci (1.1–1.4) risultano già fatte nei giri precedenti; nessun codice
  nuovo in questo giro.

Giro 4 (revisione dei commit di stanotte e degli ultimi 7 giorni: sono gli 8 di stanotte):
- `e257688` (style: auto, `p.card`): riletto riga per riga. Nessun punto legge `config.style` saltando
  `snStyle()` (l'unico uso è `_palette()` e il setter `hass` di `SnCard`); badge e tile feature usano già
  le variabili del tema; `setConfig` azzera `_rendered`, quindi cambiare `style` dall'editor ridisegna;
  `o_auto` esisteva già (en/it, le uniche lingue delle etichette del form). Nessun bug trovato.
- Test di stanotte (`db0920b`, `b62d2d3`, `f41be67`) e docs (`76bddb5`, `9035e0a`): corretti; il link
  `../../tools/genera_vista_automazioni.py` punta a un file che esiste.
- Unico buco trovato: `style: auto` guarda solo il tema del profilo/server, non il tema impostato su una
  singola vista (che non arriva in `hass`). Comportamento coerente col codice ma non scritto nei docs:
  aggiunta una riga alla FAQ in docs/configuration.md: `5d81d4b`.

## Non fatto e perché

- Giro 3: node_modules e .venv NON sono presenti nel worktree (di nuovo, diversamente da quanto previsto).
  jsdom preso dalla node_modules della cartella originale con un hook di risoluzione nello scratchpad;
  i controlli Python girati con il Python di sistema. `tools/contrast_audit.mjs` non eseguito: richiede
  Playwright, che non è installato e non va installato (sarebbe una dipendenza Node nuova).

- node_modules NON era presente nel worktree (diversamente da quanto previsto). Non ho installato nulla:
  i test girano con un hook di risoluzione nello scratchpad che prende `jsdom` dalla node_modules della
  cartella originale (sola lettura). Nessun file del repo toccato per questo.
- Nella prima esecuzione della suite 4 file erano rossi (59/63), nella seconda 63/63 senza modifiche:
  probabili test sensibili ai tempi. Non ho il nome dei 4 (output troncato); da tenere d'occhio.
- Prova a mano su HA (tema default chiaro/scuro, tema a vetro "Cielo", cambio tema dal profilo): non
  eseguibile di notte (niente dispositivi reali). Da fare.

- Giro 4: suite eseguita due volte. La prima 62/64 (l'output finiva in `tail`, quindi i nomi dei 2 file
  rossi sono andati persi; girava in parallelo a un test singolo lanciato da me), la seconda 64/64 senza
  modifiche al codice. Di nuovo test sensibili ai tempi/carico: per il prossimo giro salvare l'output
  completo (`> suite.log`) per avere i nomi. `node -c` e `check_card_versions.py --base main` verdi.
- Giro 4: `snStyle()` dà la precedenza a `hass.selectedTheme.theme` su `hass.themes.theme`. Se, come
  ricordo, il frontend di HA mette in `hass.themes.theme` il tema effettivamente applicato (profilo, oppure
  `default_dark_theme` del server col modo scuro), le due fonti coincidono e va bene; non ho potuto
  verificarlo sul sorgente del frontend (non c'è in locale, niente rete). Da controllare con un tema scuro
  predefinito del server (`default_dark_theme`) e `style: auto`.

## Da decidere

- `style: auto` come nuovo predefinito (la nota dice "valutare in una minor"): per ora il predefinito resta
  `supernotify`.
- Numeri di versione delle card: ho fatto un bump minor di tutte e 14 (richiesto da check_card_versions.py
  perché il codice di ogni card è cambiato); la versione del bundle (VERSION 1.0.0) non è toccata, le voci sono
  in CHANGELOG sotto [Unreleased]. Da rivedere al momento della release.
- Lingua dei commit: le regole della notte chiedono italiano, il CLAUDE.md del progetto (repo pubblico) chiede
  inglese per commit e codice; ho seguito il CLAUDE.md come il giro 1.

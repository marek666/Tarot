# Tarot Trainer

Minimalistická mobile-first PWA pro postupné učení kompletního balíčku Rider–Waite–Smith. Projekt používá Svelte 5, TypeScript a Vite a funguje bez backendu, routeru i uživatelských účtů.

Karty lze procházet v tradičním pořadí nebo po zamíchání algoritmem Fisher–Yates. Volitelný režim Reversed losuje orientaci každé nové karty a zobrazí její odpovídající význam.

Klepnutím se karta otočí na český výklad. Mezi kartami lze přecházet tlačítky, vodorovným swipem nebo šipkami na klávesnici.

Aplikace nabízí také režim Učení. Význam se v něm odhalí až samostatným tlačítkem a kartu lze označit jako „Umím“ nebo „Procvičit“. Procvičované karty mají prioritu na začátku dalšího studijního kola, aniž by se právě dokončená karta bezdůvodně ihned zopakovala.

## Lokální pokrok

Aktuální karta, režim, pořadí balíčku, již vylosované orientace a studijní pokrok se průběžně ukládají do `localStorage`. Po opětovném otevření aplikace pokračuje relace na stejném místě. Data používají verzované schéma; neplatný nebo poškozený záznam se bezpečně zahodí a aplikace vytvoří nový výchozí stav.

Pokrok je veden primárně pro kartu jako celek. Datový model současně obsahuje připravené rozlišení přímého a obráceného významu pro případné budoucí rozšíření. Reset studijního pokroku vyžaduje potvrzení a nemaže aktuální kartu ani nastavení Shuffle a Reversed.

## Požadavky

- Node.js 22.18 nebo novější (kontrolní skript využívá vestavěnou podporu TypeScriptu)
- npm

## Spuštění

```bash
npm install
npm run dev
```

Vite po spuštění vypíše lokální adresu vývojového serveru. Service worker se vytváří až při produkčním buildu, aby během vývoje nedržel zastaralé soubory.

Produkční náhled včetně PWA vrstvy:

```bash
npm run build
npm run preview
```

Pro instalaci a service worker musí být aplikace otevřená přes HTTPS; výjimkou je lokální `localhost`.

## Tarotová data

Kompletní balíček je exportovaný z `src/data/tarotDeck.ts`. Typy jsou v `src/types/tarot.ts` a hloubková validace v `src/lib/validateTarotDeck.ts`. Původ lokálních public-domain ilustrací popisuje `ATTRIBUTION.md`.

Obnovení lokálních obrázků s ověřením původních souborů vůči Wikimedia Commons a stažením jejich mobilních kopií z veřejného zrcadla:

```bash
npm run download:cards
```

## Offline PWA

Produkční service worker předem ukládá aplikační soubory, kompletní česká data a všech 78 lokálních ilustrací. Po zobrazení oznámení „Aplikace je připravená offline“ lze aplikaci znovu otevřít bez připojení. Při vydání nové verze se zobrazí nabídka k bezpečnému načtení aktualizace.

- Android/Chrome: použijte nabídku **Instalovat aplikaci** nebo **Přidat na plochu**.
- iPhone/iPad/Safari: použijte **Sdílet → Přidat na plochu**. iOS nezobrazuje vlastní programové instalační tlačítko.

Manifest a offline cache se automaticky ověří příkazem `npm run validate:pwa` po vytvoření `dist/`.

## Kontrola a build

```bash
npm test
npm run check
npm run build
npm run validate:pwa
```

Všechny kroky lze spustit najednou:

```bash
npm run verify
```

`npm test` spustí jednotkové testy míchání, orientace, studijní logiky a obnovy verzovaného lokálního stavu. `npm run check` ověřuje tarotová data a TypeScript/Svelte komponenty. `npm run validate:pwa` kontroluje manifest, rozměry ikon, aplikační bundle a všech 78 obrázků v precache. Produkční soubory vzniknou v adresáři `dist/`.

## Nasazení

1. Na čistém prostředí spusťte `npm ci` a `npm run verify`.
2. Nahrajte celý obsah adresáře `dist/` do kořene statického HTTPS hostingu.
3. Soubor `sw.js` servírujte bez dlouhodobé cache, například s `Cache-Control: no-cache`. Soubory v `assets/` mají hash v názvu a mohou mít dlouhou immutable cache.
4. Po nasazení otevřete aplikaci online, vyčkejte na potvrzení offline připravenosti a teprve potom ověřte režim bez připojení.

Manifest používá `start_url` a `scope` nastavené na `/`; nasazení se proto očekává v kořeni domény.

## Struktura

```text
src/
├── components/   Svelte komponenty uživatelského rozhraní
├── data/         Statická data aplikace
├── lib/          Pomocná logika bez vazby na UI
├── styles/       Globální styly a designové proměnné
└── types/        Sdílené TypeScript typy
public/
├── cards/        Lokální public-domain obrázky karet
└── *.png         PWA a Apple ikony
scripts/          Validace dat a produkční PWA
tests/            Jednotkové testy aplikační logiky
```

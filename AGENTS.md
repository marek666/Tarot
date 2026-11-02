# AGENTS.md

## Cíl projektu

Tarot Trainer je minimalistická mobilní PWA pro učení tarotových karet. Zachovávej ji rychlou, přehlednou, offline použitelnou a snadno udržovatelnou. Novou vrstvu, abstrakci nebo závislost přidávej jen tehdy, když řeší konkrétní současný požadavek.

## Architektura

- `src/components/` obsahuje malé Svelte komponenty bez vloženého datového balíčku.
- `src/data/tarotDeck.ts` je jediný zdroj obsahu 78 Rider–Waite–Smith karet; `src/data/foolsJourney.ts` obsahuje samostatný výukový příběh odkazující na karty stabilními ID.
- `src/lib/` obsahuje čistou logiku pořadí, orientace, studia, persistence a validace bez vazby na vykreslování.
- `src/lib/trainerState.ts` vlastní verzované schéma `localStorage`; migrace nesmí potichu ztratit platný pokrok.
- `src/lib/dailyCard.ts` vlastní oddělený verzovaný denní los; nesmí měnit hlavní balíček, studijní data ani Cestu Blázna.
- `src/lib/spreadState.ts` vlastní samostatný verzovaný tříkaretní výklad; interpretace pozic a celku patří do `src/lib/spreadInterpretation.ts`.
- `src/components/CardPicker.svelte` je společný modalní výběr karet a kapitol; čisté vyhledávání a filtrování patří do `src/lib/cardPicker.ts`.
- `src/styles/` obsahuje globální CSS a designové proměnné.
- `src/types/` obsahuje sdílené TypeScript typy.
- `public/cards/` obsahuje 78 lokálních public-domain ilustrací; původ dokumentuje `ATTRIBUTION.md`.
- `tests/*.test.ts` testují čistou logiku a `tests/e2e/` hlavní mobilní a offline scénáře.

## Konvence

- Používej Svelte 5 a TypeScript; každý `<script>` v komponentě musí mít `lang="ts"`.
- Preferuj lokální stav Svelte. Nepřidávej globální state management, router, backend, API, databázi ani autentizaci.
- Komponenty pojmenovávej v `PascalCase`, proměnné a funkce v `camelCase`.
- Nepoužívej `any` bez zdůvodnění a drž aplikační logiku testovatelnou mimo komponenty.
- Styluj mobile-first od 320 px, bez pevných výšek stránky. Respektuj safe-area insets, 44×44 px dotykové cíle a viditelné focus stavy.
- Zachovej tmavě modrou paletu, střídmé zlaté akcenty, plné ilustrace bez ořezu a `prefers-reduced-motion`.
- Obrácená poloha otáčí pouze ilustraci. Název a výklad musí zůstat normálně čitelné a musí používat `reversed` data stejné karty.
- Shuffle používá Fisher–Yates bez opakování do konce průchodu. Reversed losuje orientaci pouze pro nově rozdanou kartu.
- Přímý výběr karty musí zachovat stávající pořadí balíčku, přidělené orientace i studijní data; přeskočené karty zůstávají nedotčené.
- Neměň stabilní ID karet ani klíč `tarot-trainer:state` bez verzované migrace a testu obnovy.
- Cesta Blázna používá pouze 22 Velkých arkán v pevném pořadí, nereaguje na Shuffle ani Reversed a nesmí duplikovat obrázky nebo klasická kartová data.
- Karta dne odkazuje na stabilní ID, drží kartu i orientaci po celý místní kalendářní den a tematická oblast nikdy nespouští nový los.
- Tříkaretní výklad používá tři unikátní stabilní ID, samostatně uložené orientace a stav odhalení. Nesmí čerpat z pořadí hlavního balíčku ani měnit `tarot-trainer:state` či `tarot-trainer:daily-card`.
- Nepřidávej balíček kvůli drobné funkci, kterou lze jasně napsat několika řádky. Výjimkou jsou cílené vývojové nástroje, například Playwright pro E2E ověření.

## Tarotová data a PWA

- Pořadí je: 22 Velkých arkán 0–21, poté 14 holí, pohárů, mečů a pentaklů 1–14.
- Každý význam má 3–5 konkrétních klíčových slov, stručný český význam a věcný delší výklad. Obrácený význam není automaticky negativní.
- Při úpravě karet aktualizuj validaci pouze tehdy, pokud se záměrně mění podporovaný datový model.
- Všechny runtime prostředky musí zůstat lokální a zahrnuté v precache. Nepřidávej externí fonty, obrázky ani API.
- Denní tematické interpretace musí zůstat statické, konkrétní pro kartu a formulované jako symbolický podnět, nikoli jistá předpověď.
- Interpretace tří karet musí odlišit klasický význam, roli pozice a tematickou oblast. Společný výklad používá transparentní deterministická pravidla a nikdy netvrdí jistý budoucí výsledek.
- Aktualizace service workeru musí zůstat potvrzovaná uživatelem a nesmí mazat `localStorage`.

## Kontrola změn

Před dokončením vždy spusť:

```bash
npm run verify
npm audit --omit=dev
```

`verify` zahrnuje unit testy, validaci všech 78 karet, Svelte/TypeScript kontrolu, produkční build, PWA validaci a Playwright smoke testy. Vše musí projít bez chyb. Pokud prostředí neobsahuje Chromium v `/usr/bin/chromium-browser`, nastav `PLAYWRIGHT_CHROMIUM_PATH`.

Po produkčním deploymentu spusť také `npm run verify:production`; kontroluje veřejný přístup bez přihlášení, manifest, service worker a dostupnost všech 78 ilustrací.

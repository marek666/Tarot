# AGENTS.md

## Cíl projektu

Tarot Trainer je minimalistická mobilní aplikace pro učení tarotových karet. Zachovávej ji rychlou, přehlednou a snadno udržovatelnou. Nové vrstvy a abstrakce přidávej jen tehdy, když řeší konkrétní současný požadavek.

## Architektura

- `src/components/` obsahuje malé, znovupoužitelné Svelte komponenty.
- `src/data/` obsahuje statická data; komponenty nemají obsahový dataset definovat přímo.
- `src/lib/` obsahuje čisté pomocné funkce a aplikační logiku bez vazby na vykreslování.
- `src/styles/` obsahuje globální CSS, designové proměnné a případné sdílené styly.
- `src/types/` obsahuje sdílené TypeScript typy.
- `public/cards/` je vyhrazený pro statické obrázky tarotových karet.

## Konvence

- Používej Svelte 5 a TypeScript; každý blok `<script>` v komponentě musí mít `lang="ts"`.
- Preferuj lokální stav Svelte. Nepřidávej globální state management, dokud pro něj nevznikne jasná potřeba.
- Komponenty pojmenovávej v `PascalCase`, proměnné a funkce v `camelCase`.
- Sdílené typy pojmenovávej popisně a nepoužívej `any` bez zdůvodnění.
- Styluj mobile-first a ověřuj použitelnost od šířky 320 px.
- Používej sémantické HTML, čitelné kontrasty a viditelné focus stavy pro interaktivní prvky.
- Zachovej tmavě modrou paletu a střídmé zlaté akcenty.
- Nepřidávej router, backend, API, databázi, autentizaci, PWA vrstvu ani velký UI framework bez výslovného požadavku.
- Nepřidávej balíček jen kvůli drobné funkci, kterou lze jasně napsat několika řádky.

## Kontrola změn

Před dokončením změny spusť:

```bash
npm run check
npm run build
```

Oba příkazy musí projít bez chyb.

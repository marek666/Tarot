# Tarot Trainer 0.2.0

Minimalistická mobile-first PWA pro učení všech 78 karet Rider–Waite–Smith. Funguje bez backendu, účtu a připojení po prvním úspěšném načtení. Používá Svelte 5, TypeScript, Vite, čisté CSS, `vite-plugin-pwa` a malé testy nad vestavěným Node test runnerem a Playwrightem.

## Co aplikace umí

- Prohlížení karet v tradičním pořadí nebo bez opakování po Fisher–Yates zamíchání.
- Volitelný Reversed režim: každá nově rozdaná karta má nezávisle 50% šanci na obrácenou polohu; obrázek se otočí a výklad zůstane čitelný.
- Plynulé 3D otočení, navigaci tlačítky, vodorovným swipem a klávesami se zohledněním `prefers-reduced-motion`.
- Režim Učení s odhalením významu a volbou „Umím“ nebo „Procvičit“.
- Trvalé verzované uložení režimu, aktuální karty, zamíchaného pořadí, rozdaných orientací a pokroku v `localStorage`.
- Offline provoz, instalovatelný manifest, lokální public-domain ilustrace a potvrzenou aktualizaci service workeru.

## Struktura projektu

```text
src/
├── components/   malé Svelte komponenty UI a PWA oznámení
├── data/         všech 78 karet a jejich české výklady
├── lib/          čistá logika balíčku, studia, persistence a validace
├── styles/       globální CSS a designové proměnné
└── types/        sdílené TypeScript typy
public/
├── cards/        78 lokálních Rider–Waite–Smith ilustrací
└── *.png         PWA ikony 192, 512 a Apple touch icon 180 px
scripts/          validace dat, PWA a obnova obrázků
tests/
├── e2e/          mobilní, dotykové, stavové a offline Playwright smoke testy
└── *.test.ts     jednotkové testy čisté logiky
```

`src/App.svelte` skládá obrazovku a drží lokální stav. `src/components/TarotCard.svelte` pouze vykresluje kartu a její interakce. Pořadí, orientace, studijní priorita a persistence jsou oddělené v `src/lib/`.

## Spuštění na Fedoře

Projekt vyžaduje Node.js 22.18 nebo novější a npm. Pro browser testy je na Fedoře potřeba Chromium.

```bash
sudo dnf install nodejs npm chromium
node --version
npm ci
npm run dev
```

Vite vypíše lokální adresu. Vývojový server záměrně negeneruje aktivní produkční service worker.

Produkční build a jeho lokální náhled:

```bash
npm run build
npm run preview
```

Výsledek je v `dist/`. Instalace PWA a service worker vyžadují HTTPS; `localhost` je pro vývoj bezpečná výjimka.

## Kontroly a testy

```bash
npm test             # unit testy
npm run check        # data + Svelte + TypeScript
npm run build        # produkční bundle a service worker
npm run validate:pwa # manifest, ikony, česká data a precache
npm run test:e2e     # build + Chromium smoke testy
npm run verify       # všechny výše uvedené kontroly v jednom běhu
npm audit --omit=dev
```

Playwright na Fedoře standardně používá `/usr/bin/chromium-browser`. Jinou instalaci lze vybrat proměnnou `PLAYWRIGHT_CHROMIUM_PATH=/cesta/ke/chromiu`.

## Offline režim a aktualizace

Produkční service worker předem uloží HTML, JavaScript, CSS, manifest, ikony a všech 78 ilustrací. České názvy a významy jsou součástí aplikačního JavaScriptu, takže nevyžadují API ani síť. Aplikace je plně offline po prvním úspěšném načtení a dokončení precache, které oznámí zprávou „Aplikace je připravená offline“.

Nový service worker čeká na souhlas uživatele. Po potvrzení aktualizace převezme novou verzi a stránka se načte znovu. Studijní stav je samostatně v `localStorage`, takže výměna cache jej nemaže. Poškozená nebo neznámá verze lokálních dat se bezpečně nahradí výchozím stavem.

- Android/Chrome: použijte nabídku **Instalovat aplikaci** nebo **Přidat na plochu**.
- iPhone/Safari: použijte **Sdílet → Přidat na plochu**. Krátká nápověda se zobrazí pouze v relevantním Safari, lze ji zavřít a po prvním zobrazení se neopakuje.

## Úprava karet a překladů

Datový model je v `src/types/tarot.ts` a obsah v `src/data/tarotDeck.ts`. Každá karta musí mít unikátní `id`, tradiční číslo a pořadí, český a anglický název, arkánu/barvu, cestu k lokálnímu obrázku a přímý i obrácený význam. Každý význam vyžaduje 3–5 klíčových slov, stručné shrnutí a podrobnější vysvětlení.

Po každé obsahové změně spusťte:

```bash
npm run validate:data
npm test
```

Validátor kontroluje přesně 78 karet, kanonické pořadí a názvy, členění arkán, unikátní ID a obrázky, neprázdné významy i JPEG rozměry. Původ a právní stav ilustrací popisuje [ATTRIBUTION.md](./ATTRIBUTION.md). Obrázky lze znovu stáhnout a ověřit příkazem `npm run download:cards`.

Pro budoucí jazyk je vhodné zachovat stabilní ID karet a přidat typovanou překladovou vrstvu oddělenou od ilustrací a logiky. Přidání jiného balíčku vyžaduje vlastní dataset, assety a odpovídající validační profil; nemá se obcházet současná RWS validace.

## Nasazení

### Vercel

Repozitář je připraven jako Vite projekt:

- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`

Po propojení Git repozitáře Vercel automaticky vytvoří produkční deployment z větve `main`. Projekt nepotřebuje proměnné prostředí ani tajné údaje.

### Jiný statický hosting

1. Spusťte `npm ci && npm run verify`.
2. Publikujte obsah `dist/` do kořene HTTPS domény.
3. Přesměrujte navigační požadavky na `index.html`.
4. `sw.js` a `manifest.webmanifest` servírujte bez dlouhé cache; hashované soubory v `assets/` mohou mít immutable cache.

Manifest používá `start_url`, `scope` a `id` `/`, proto tato konfigurace očekává nasazení v kořeni domény.

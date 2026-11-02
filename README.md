# Tarot Trainer 0.4.1

Minimalistická mobile-first PWA pro učení všech 78 karet Rider–Waite–Smith. Funguje bez backendu, účtu a připojení po prvním úspěšném načtení. Používá Svelte 5, TypeScript, Vite, čisté CSS, `vite-plugin-pwa` a malé testy nad vestavěným Node test runnerem a Playwrightem.

## Co aplikace umí

- Prohlížení karet v tradičním pořadí nebo bez opakování po Fisher–Yates zamíchání.
- Volitelný Reversed režim: každá nově rozdaná karta má nezávisle 50% šanci na obrácenou polohu; obrázek se otočí a výklad zůstane čitelný.
- Plynulé 3D otočení, navigaci tlačítky, vodorovným swipem a klávesami se zohledněním `prefers-reduced-motion`.
- Režim Učení s odhalením významu a volbou „Umím“ nebo „Procvičit“.
- Režim Cesta Blázna: souvislý výukový příběh všech 22 Velkých arkán se symbolikou, lekcemi a klasickým významem karty.
- Karta dne: jeden bezpečně vylosovaný lokální podnět pro každý kalendářní den s uloženou orientací a oblastmi Obecně, Vztahy, Práce a Osobní rozvoj.
- Tříkaretní výklady v části Karta dne: tři šablony, unikátní bezpečně vylosované karty, volitelný Reversed a výukové odhalování vlastního výkladu před vzorem.
- Společné čtení tří pozic pomocí transparentních pravidel pro Velká arkána, opakované barvy a obrácené karty, vždy jako podnět k reflexi, ne jistá předpověď.
- Lokální Deník výkladů pro ukládání Karty dne a dokončených tříkaretních výkladů, vlastní poznámky, filtry, bezpečné odstranění a JSON zálohu/import.
- Kompaktní režimová navigace v desktopové hlavičce a přístupný mobilní hamburger, který nepřesouvá obsah stránky.
- Adaptivní čtecí rozhraní Cesty Blázna: jednosloupcový mobil a portrait tablet, vyvážené dva sloupce v landscape a na desktopu a výškově podmíněná sticky ilustrace.
- Jednotný výběr libovolné karty nebo kapitoly s náhledy, vyhledáváním bez diakritiky a filtry arkán, barev, studijního stavu i oblíbených.
- Oblíbené karty v Prohlížení, Učení, Cestě Blázna i Kartě dne se ukládají společně a neovlivňují studijní hodnocení.
- Kompaktní rozbalovací panel studijního pokroku, který se zobrazuje pouze v režimu Učení.
- Trvalé verzované uložení režimu, aktuální karty, zamíchaného pořadí, rozdaných orientací a pokroku v `localStorage`.
- Offline provoz, instalovatelný manifest, lokální public-domain ilustrace a potvrzenou aktualizaci service workeru.

## Struktura projektu

```text
src/
├── components/   malé Svelte komponenty UI a PWA oznámení
├── data/         78 karet, tematické kontexty a 22 kapitol Cesty Blázna
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

`src/App.svelte` skládá obrazovku a drží lokální stav. `src/components/AppHeader.svelte` obsluhuje kompaktní režimovou navigaci, `src/components/TarotCard.svelte` klasickou kartu, `src/components/DailyCard.svelte` denní výklad, `src/components/ThreeCardSpread.svelte` tříkaretní výklad, `src/components/ReadingJournal.svelte` deník, `src/components/CardPicker.svelte` společný přístupný výběr, `src/components/FoolsJourney.svelte` příběhovou kapitolu a `src/components/StudyProgressPanel.svelte` pokrok. Pořadí, denní i tříkaretní los, interpretace pozic, deník, filtrování pickeru, studijní priorita, validace příběhu a persistence jsou oddělené v `src/lib/`.

## Spuštění na Fedoře

Projekt vyžaduje Node.js 22.18 nebo novější v rámci hlavní řady 22.x a npm. Stejná řada je nastavená pro Vercel, aby build nepřecházel automaticky na budoucí hlavní verzi. Pro browser testy je na Fedoře potřeba Chromium.

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
npm run verify:production # veřejná produkce a všech 78 ilustrací
npm audit --omit=dev
```

Playwright na Fedoře standardně používá `/usr/bin/chromium-browser`. Jinou instalaci lze vybrat proměnnou `PLAYWRIGHT_CHROMIUM_PATH=/cesta/ke/chromiu`.

### Bezpečnost závislostí

Aplikace nemá žádné produkční npm závislosti; výsledkem buildu jsou pouze statické soubory. `npm audit --omit=dev` proto musí vrátit 0 nálezů. Úplný `npm audit` může hlásit vývojové tranzitivní balíčky nástrojů Svelte/Workbox. Dokud jejich správci nevydají kompatibilní opravu, nepoužívejte `npm audit fix --force`: navrhovaný downgrade PWA pluginu je breaking změna a runtime bezpečnost statické aplikace nezlepší.

## Offline režim a aktualizace

Produkční service worker předem uloží HTML, JavaScript, CSS, manifest, ikony a všech 78 ilustrací. České názvy, klasické významy, 624 kombinací denních tematických výkladů, 5 616 kombinací tříkaretních pozic a celý text Cesty Blázna jsou součástí aplikačního JavaScriptu, takže nevyžadují API ani síť. Aplikace je plně offline po prvním úspěšném načtení a dokončení precache, které oznámí zprávou „Aplikace je připravená offline“.

Nový service worker čeká na souhlas uživatele. Po potvrzení aktualizace převezme novou verzi a stránka se načte znovu. Studijní stav je samostatně v `localStorage`, takže výměna cache jej nemaže. Poškozená nebo neznámá verze lokálních dat se bezpečně nahradí výchozím stavem.

Hlavní relace a oblíbené používají verzovaný klíč `tarot-trainer:state`. Denní los má oddělený verzovaný klíč `tarot-trainer:daily-card`, aby nikdy neměnil pořadí balíčku, orientace rozdaných karet ani studijní pokrok. Datum se zapisuje podle místního kalendáře ve formátu `YYYY-MM-DD`; po změně místního dne se při otevření nebo návratu do aplikace vytvoří nový los. Jeden rozpracovaný tříkaretní výklad je samostatně ve verzovaném klíči `tarot-trainer:spread`; jeho schéma v2 navíc ukládá stabilní náhodné ID a čas jednoho vyložení a automaticky migruje v1. Uchovává šablonu, oblast, otázku, tři ID a orientace i stav odhalení a nijak nemění hlavní ani denní relaci.

Deník používá nezávislé schéma v2 v `tarot-trainer:journal`; zkušební data v1 s krátkým obsahovým hashem se automaticky a bezztrátově migrují na stabilní ID. Uložené záznamy jsou snapshoty stabilních ID, orientací, rozložení a uživatelských poznámek; aktuální interpretační texty se při zobrazení znovu skládají ze zdrojových dat, a proto se mohou po budoucí obsahové aktualizaci změnit. Poznámky zůstávají beze změny. Deník má limit 100 záznamů a nic automaticky nemaže. Před smazáním dat prohlížeče vytvořte zálohu přes **Výklady → Deník → Export JSON**; import záznamy bezpečně slučuje podle ID a nepřepisuje již uložená data.

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

Příběhový obsah je samostatně v `src/data/foolsJourney.ts` a jeho typ v `src/types/foolsJourney.ts`. Kapitola odkazuje stabilním `cardId` na existující Velkou arkánu a neduplikuje ilustraci ani klasický výklad. Validace vyžaduje přesně 22 kapitol ve správném pořadí, 100–180 slov příběhu, 2–4 skutečné symboly a 3–5 klíčových slov. Přidání dalšího jazyka má zachovat stejná ID a přesunout texty do samostatné typované překladové vrstvy.

Tematická vrstva Karty dne je v `src/data/dailyInterpretations.ts`; skládá kartě specifický tradiční význam s ručně připraveným profilem Velké arkány nebo s konkrétní kombinací barvy a hodnoty Malé arkány. `npm run validate:data` kontroluje všech 624 kombinací karty, oblasti a orientace. Texty zůstávají symbolickými podněty, nikoli jistou předpovědí budoucnosti.

Tříkaretní šablony jsou v `src/data/spreadLayouts.ts`, verzovaný stav v `src/lib/spreadState.ts` a čistá interpretace pozic i celku v `src/lib/spreadInterpretation.ts`. Šablony odkazují na existující karty stabilními ID a obrázky neduplikují. Validátor prochází všech 5 616 kombinací karty, orientace, oblasti, šablony a pozice; při úpravě textů zachovejte odlišení role pozice od klasického významu a nepoužívejte formulace jisté předpovědi.

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

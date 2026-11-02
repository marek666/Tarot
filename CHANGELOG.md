# Changelog

Všechny podstatné změny projektu jsou evidovány v tomto souboru.

## 0.3.3 — připravuje se

### Přidáno

- Oblíbené karty (☆/★) v Prohlížení, Učení i Cestě Blázna; oblíbené jsou nezávislé na studijním hodnocení.
- Filtr „Pouze oblíbené“ ve společném výběru karet a kapitol.
- Verzované ukládání oblíbených s migrací v1/v2 → v3 bez ztráty rozpracované relace.
- Unit testy přidání/odebrání oblíbené karty a migrace uloženého stavu.

## 0.3.2 — 2026-11-02

### Změněno

- Cesta Blázna používá adaptivní jednosloupcové rozložení na mobilu a portrait tabletu a široké dva sloupce v landscape a na desktopu.
- Levý sloupec obsahuje kartu a její metadata, pravý sloupec vede názvem kapitoly a čtecím textem omezeným na přibližně 72 znaků na řádek.
- Informační sekce používají lehčí typografické oddělení a méně dekorativních rámečků.
- Desktopové ovládání režimů Prohlížení a Učení je mírně rozšířené bez změny struktury obrazovky.
- Node.js engine je omezen na kompatibilní řadu `>=22.18.0 <23` pro shodu lokálního a Vercel prostředí.

### Přidáno

- Sticky ilustrace pouze pro desktopové viewporty od 1100×900 px, kde se vejde bez ořezu.
- Automatické full-page screenshoty deseti mobilních, tabletových a desktopových viewportů a screenshoty dialogu výběru kapitoly.
- Regresní testy přechodu mezi kapitolami po scrollování, návratu z klasického významu, změny orientace tabletu a responzivních šířek.

### Opraveno

- Tabletový text se již netlačí do úzkého sloupce uvnitř původního 38rem obalu.
- Změna kapitoly vrátí čtenáře na začátek nového obsahu a zavření klasického významu obnoví předchozí pozici příběhu.

## 0.3.1 — 2026-11-02

### Přidáno

- Společný přístupný výběr karet a kapitol jako mobilní bottom sheet a centrovaný desktopový dialog.
- Vyhledávání podle českých i anglických názvů bez nutnosti zadávat diakritiku.
- Filtry Velkých a Malých arkán, jednotlivých barev a v režimu Učení také stavů Umím, Procvičit a Zbývající.
- Unit a Playwright testy přímého výběru, filtrování, klávesnice, Shuffle, Reversed, reloadu a studijního pokroku.

### Změněno

- Cesta Blázna používá stejný dialog pro výběr svých 22 kapitol.
- Desktopová Cesta Blázna využívá široké dvousloupcové rozložení se sticky panelem karty.

### Opraveno

- Uložená relace nyní korektně obnoví přímý skok na vzdálenou kartu, aniž by přeskočeným kartám přidělila orientaci nebo studijní stav.

## 0.3.0 — 2026-11-02

### Přidáno

- Samostatný offline režim Cesta Blázna s 22 navazujícími kapitolami Velkých arkán, původními ilustracemi, symbolikou, lekcemi, klíčovými slovy a vazbou na klasický význam.
- Výběr libovolné kapitoly, návrat do předchozího režimu a samostatné uložení poslední i nejvyšší dosažené kapitoly.
- Kompaktní, přístupný a lokálně uložený panel studijního pokroku pouze v režimu Učení.
- Validace příběhových dat a Playwright scénáře pro navigaci, obnovení, offline provoz, migraci a responzivitu.

### Změněno

- Schéma relace bylo povýšeno na verzi 2 s automatickou migrací dat z 0.2.x bez ztráty studijního pokroku.
- Český název XIV Velké arkány je sjednocen na „Mírnost“.

## 0.2.3 — 2026-11-01

### Opraveno

- Přepínač Reversed již nezahajuje nové procházení od první karty. Změní orientaci právě zobrazené karty a zachová její index, pořadí balíčku, odhalenou stranu i studijní pokrok.
- Vypnutí Reversed vrátí již rozdané karty do přímé polohy; nové karty při zapnutém režimu nadále používají 50% pravděpodobnost.

## 0.2.2 — 2026-11-01

### Opraveno

- Rychlé tapy během 3D animace se již nezahazují; výsledná strana odpovídá počtu přepnutí.
- Navigace, změna režimu nebo nové nastavení během animace vždy připojí novou kartu přední stranou.
- Zrušené pointer gesto již nemůže omylem vyvolat navigaci.
- Obnovená relace se načte před prvním vykreslením balíčku, takže aktualizace PWA neblikne první kartou.

### Přidáno

- Regresní scénáře pro opakované a rychlé flipy na kartách 25 a 37, navigaci 50→51, úplný Shuffle průchod, reload karty 40 a zachování pokroku po kontrole service workeru.
- Nezávislá produkční kontrola veřejného HTML, manifestu, service workeru a všech 78 ilustrací.

## 0.2.1 — 2026-11-01

### Opraveno

- Mobilní plocha karty zachytí pointer až při swipu, takže první obyčejné tapnutí v Safari nezůstane bez odezvy.
- Browser regrese pro obrácený význam nyní používá skutečné dotykové události včetně iPhone profilu.

## 0.2.0 — 2026-11-01

### Přidáno

- Režim Učení s hodnocením „Umím“ a „Procvičit“ a jednoduchou prioritou opakování.
- Verzované trvalé uložení celé rozpracované relace a studijního pokroku.
- Jednorázová kontextová instalační nápověda pro Safari na iPhonu.
- Playwright smoke testy mobilních viewportů, dotyku, změny orientace, obnovy relace a offline provozu.

### Změněno

- Mobilní rozhraní karty, swipy, safe-area podpora a samostatné zobrazení českého názvu.
- Přísnější validace kanonického pořadí, názvů, cest a fyzických rozměrů všech 78 ilustrací.
- PWA validace nyní ověřuje česká data, zachování lokálního stavu a mechanismus aktualizace.

### Opraveno

- Klepnutí na obrácenou kartu vždy odhalí obrácený význam; případný duplicitní dotyk ji nemůže během animace okamžitě vrátit.
- Swipe už nezpůsobuje následné náhodné otočení karty.
- Neplatná nebo poškozená data v `localStorage` se bezpečně zahodí bez pádu aplikace.

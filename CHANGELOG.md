# Changelog

Všechny podstatné změny projektu jsou evidovány v tomto souboru.

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

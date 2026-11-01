# Changelog

Všechny podstatné změny projektu jsou evidovány v tomto souboru.

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

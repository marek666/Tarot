# Původ obrázků

Všech 78 obrázků v `public/cards/` pochází z kompletní sady **Rider–Waite tarot deck (Roses & Lilies)** na Wikimedia Commons:

- Zdrojová kategorie: <https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck_(Roses_%26_Lilies)>
- Autorka ilustrací: **Pamela Colman Smith** (1878–1951)
- Vydavatel původního balíčku: **Rider Company**, 1909
- Digitalizace: skeny originálního balíčku „Roses & Lilies“ ze sbírky Saskie Jansen
- Právní stav: **public domain** v zemi původu a v USA; Wikimedia Commons soubory označuje také Public Domain Mark 1.0

Použity jsou původní soubory `RWS1909 - 00 Fool.jpeg` až `RWS1909 - 21 World.jpeg` a `RWS1909 - Wands/Cups/Swords/Pentacles 01–14.jpeg`. Pro mobilní použití projekt ukládá jejich JPEG kopie o šířce 640 px, které poskytuje veřejné zrcadlo Arcanebra. Arcanebra uvádí, že jde o serverově překódované kopie přesně těchto 78 skenů z Wikimedia Commons, nikoli o nově kreslenou nebo kolorovanou verzi:

- Metodika zrcadla a evidence všech 78 souborů: <https://arcanebra.com/methodology/>

Příklad záznamu zdroje a licence: <https://commons.wikimedia.org/wiki/File:RWS1909_-_00_Fool.jpeg>

Skript `scripts/download-card-images.mjs` přes Wikimedia Commons API ověřuje existenci všech 78 původních souborů, stahuje jejich lokální 640px kopie ze zrcadla a kontroluje výsledný počet i velikost assetů.

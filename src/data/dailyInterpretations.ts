import type { TarotSuit } from '../types/tarot.ts'
import type { DailyArea } from '../types/dailyCard.ts'

export const DAILY_AREA_LABELS: Record<DailyArea, string> = {
  general: 'Obecný výklad',
  relationships: 'Vztahy',
  work: 'Práce',
  growth: 'Osobní rozvoj',
}

export interface MajorDailyProfile {
  focus: string
  reflection: string
}

/** Ručně připravené jádro kontextu každé Velké arkány. */
export const MAJOR_DAILY_PROFILES: Record<number, MajorDailyProfile> = {
  0: {
    focus: 'prvního kroku do neznáma, otevřenosti zkušenosti a zdravého rozlišení mezi důvěrou a lehkomyslností',
    reflection: 'udělat první krok a přitom nepřehlédnout skutečné riziko',
  },
  1: {
    focus: 'vědomého využití dovedností, pozornosti a prostředků, které už máte k dispozici',
    reflection: 'proměnit schopnost a záměr v konkrétní čin',
  },
  2: {
    focus: 'tiché intuice, nevyřčených informací a trpělivosti před ukvapenou odpovědí',
    reflection: 'naslouchat tomu, co ještě není vysloveno nahlas',
  },
  3: {
    focus: 'péče, tvořivosti a podmínek, v nichž může něco živého bezpečně růst',
    reflection: 'podpořit růst bez přehnané kontroly',
  },
  4: {
    focus: 'struktury, odpovědnosti a hranic, které dávají záměru stabilní oporu',
    reflection: 'vytvořit pevný rámec bez zbytečné tvrdosti',
  },
  5: {
    focus: 'sdílených hodnot, tradice, učení a otázky, které autority si zaslouží důvěru',
    reflection: 'rozlišit užitečné vedení od pouhého zvyku',
  },
  6: {
    focus: 'volby v souladu s hodnotami, vzájemnosti a ochoty nést důsledky svého ano i ne',
    reflection: 'zvolit to, co odpovídá vašim hodnotám i vztahům',
  },
  7: {
    focus: 'směru, soustředění a sladění protichůdných sil do jednoho vědomého pohybu',
    reflection: 'udržet směr, aniž byste přestali vnímat okolí',
  },
  8: {
    focus: 'klidné odvahy, sebeovládání a síly, která nemusí nikoho přemáhat',
    reflection: 'jednat odvážně a současně laskavě',
  },
  9: {
    focus: 'samoty, soustředěného hledání a vnitřního světla, které nelze nahradit cizí radou',
    reflection: 'dopřát si odstup a najít vlastní odpověď',
  },
  10: {
    focus: 'proměnlivého cyklu, načasování a rozlišení toho, co ovlivnit můžete a co nikoli',
    reflection: 'přizpůsobit se změně bez rezignace na vlastní vliv',
  },
  11: {
    focus: 'férového posouzení faktů, rovnováhy práv a odpovědnosti za důsledky',
    reflection: 'pojmenovat pravdu a rozhodnout se podle ní',
  },
  12: {
    focus: 'dobrovolného zastavení, nového úhlu pohledu a uvolnění nefunkční potřeby řídit výsledek',
    reflection: 'na chvíli přestat tlačit a podívat se jinak',
  },
  13: {
    focus: 'ukončení vyčerpané etapy, puštění staré podoby a prostoru pro skutečnou proměnu',
    reflection: 'uzavřít to, co už nemůže pokračovat ve stejné podobě',
  },
  14: {
    focus: 'mírného tempa, průběžného vyvažování a spojování rozdílných prvků do funkčního celku',
    reflection: 'hledat správnou míru místo krajního řešení',
  },
  15: {
    focus: 'pout, pokušení a návyků, které získávají sílu hlavně tehdy, když je nechceme vidět',
    reflection: 'přiznat si, co vás váže, a obnovit možnost volby',
  },
  16: {
    focus: 'náhlého odhalení, rozpadu slabého základu a pravdy, která žádá skutečnou přestavbu',
    reflection: 'opustit neudržitelnou jistotu a zachovat to podstatné',
  },
  17: {
    focus: 'obnovené naděje, otevřenosti a klidného návratu k autentickému směru',
    reflection: 'pečovat o naději konkrétním a pravdivým krokem',
  },
  18: {
    focus: 'nejistoty, citlivosti a rozlišování mezi intuicí, obavou a neúplnými informacemi',
    reflection: 'zůstat vnímaví, ale ověřit si, co je skutečnost',
  },
  19: {
    focus: 'jasnosti, vitality a radosti, kterou lze sdílet bez potřeby zmenšovat sebe nebo druhé',
    reflection: 'dovolit si viditelnost a prostou radost',
  },
  20: {
    focus: 'upřímného zhodnocení, přijetí minulosti a odpovědi na volání k vědomější etapě',
    reflection: 'poučit se z minulosti a odpovědět na to, co je nyní důležité',
  },
  21: {
    focus: 'dokončení, integrace zkušeností a uznání celku před vstupem do dalšího cyklu',
    reflection: 'uznat dokončenou práci a vědomě uzavřít kruh',
  },
}

export const SUIT_DAILY_FOCUS: Record<TarotSuit, Record<DailyArea, string>> = {
  wands: {
    general: 'Hole přidávají téma energie, iniciativy, tvořivosti a způsobu, jak zacházíte s vlastním ohněm.',
    relationships: 'Ve vztazích Hole sledují jiskru, přitažlivost, společnou aktivitu i prostor pro samostatnost.',
    work: 'V práci Hole ukazují motivaci, podnikavost, tempo a schopnost převést nápad do činu.',
    growth: 'V osobním rozvoji Hole zkoumají odvahu, tvořivý hlas a zdravé zacházení s energií.',
  },
  cups: {
    general: 'Poháry přinášejí emoce, vztahovost, představivost a schopnost přijímat i vyjadřovat city.',
    relationships: 'Ve vztazích Poháry obracejí pozornost k citové výměně, empatii a opravdové blízkosti.',
    work: 'V práci Poháry připomínají význam důvěry, smysluplnosti, spolupráce a emočních hranic.',
    growth: 'V osobním rozvoji Poháry otevírají práci s pocity, intuicí a citlivostí bez zahlcení.',
  },
  swords: {
    general: 'Meče zdůrazňují myšlení, komunikaci, rozhodnutí a zacházení s pravdou i napětím.',
    relationships: 'Ve vztazích Meče sledují otevřenost komunikace, hranice a příběhy, které si o druhých vytváříte.',
    work: 'V práci Meče míří k analýze, rozhodování, vyjednávání a následkům zvolených slov.',
    growth: 'V osobním rozvoji Meče učí rozpoznávat vlastní myšlenkové vzorce a volit přesnější pohled.',
  },
  pentacles: {
    general: 'Pentakly ukotvují výklad v těle, čase, zdrojích, řemesle a praktické udržitelnosti.',
    relationships: 'Ve vztazích Pentakly ukazují spolehlivost, každodenní péči, bezpečí a sdílení zdrojů.',
    work: 'V práci Pentakly zdůrazňují kvalitu, trpělivost, odměnu, finance a dlouhodobou udržitelnost.',
    growth: 'V osobním rozvoji Pentakly vedou k návykům, péči o tělo a převádění hodnot do běžného dne.',
  },
}

export const RANK_DAILY_FOCUS: Record<number, string> = {
  1: 'Eso označuje zárodek možnosti: potřebuje přijetí a první reálný krok, ne hotový výsledek.',
  2: 'Dvojka staví vedle sebe dvě síly nebo možnosti a žádá vědomou rovnováhu či volbu.',
  3: 'Trojka rozvíjí první krok do spolupráce, růstu nebo důsledku, který už začíná být vidět.',
  4: 'Čtyřka hledá stabilitu; současně prověřuje, zda se bezpečí nemění ve stagnaci.',
  5: 'Pětka přináší narušení a učí pracovat s nedostatkem, střetem nebo změnou podmínek.',
  6: 'Šestka hledá obnovu rovnováhy, uznání, podporu nebo přechod do klidnější fáze.',
  7: 'Sedmička prověřuje rozlišování, vytrvalost a schopnost chránit podstatné před rozptýlením.',
  8: 'Osmička uvádí téma do pohybu a ptá se po dovednosti, tempu nebo omezení, které lze uvolnit.',
  9: 'Devítka ukazuje zkušenost blízko završení a potřebu spojit odolnost s péčí o vlastní kapacitu.',
  10: 'Desítka dovádí cyklus k plnosti i zátěži a ukazuje, co je třeba sdílet, završit nebo pustit.',
  11: 'Páže přistupuje k tématu zvídavě: přináší zprávu, nový způsob učení a ochotu začít jako žák.',
  12: 'Rytíř dává tématu směr a pohyb; kvalitu výsledku určuje způsob, tempo a míra soustředění.',
  13: 'Královna rozvíjí vnitřní mistrovství, cit pro správnou míru a schopnost vytvářet podpůrné prostředí.',
  14: 'Král nese vnější odpovědnost a vedení; prověřuje, jak zrale zacházíte s vlivem a zkušeností.',
}

export const SUIT_REFLECTION: Record<TarotSuit, Record<DailyArea, string>> = {
  wands: {
    general: 'Kde dnes potřebujete použít energii cíleně',
    relationships: 'Kde ve vztahu potřebujete projevit zájem bez nátlaku',
    work: 'Který pracovní záměr potřebuje odvahu a konkrétní krok',
    growth: 'Co ve vás žádá více tvořivého prostoru',
  },
  cups: {
    general: 'Který pocit si dnes zaslouží být opravdu vyslechnut',
    relationships: 'Kde můžete být citově otevření a zároveň držet zdravou hranici',
    work: 'Kde pracovní rozhodnutí potřebuje vedle rozumu také empatii',
    growth: 'Jaký pocit můžete přijmout bez posuzování',
  },
  swords: {
    general: 'Kterou myšlenku nebo skutečnost potřebujete pojmenovat přesněji',
    relationships: 'Který rozhovor potřebuje více pravdivosti a méně domněnek',
    work: 'Které rozhodnutí potřebuje jasnější fakta nebo formulaci',
    growth: 'Který myšlenkový návyk stojí za vědomé přezkoumání',
  },
  pentacles: {
    general: 'Která praktická věc dnes nejvíc podpoří vaši stabilitu',
    relationships: 'Jak můžete blízkost vyjádřit konkrétním a spolehlivým činem',
    work: 'Který malý krok zlepší kvalitu nebo dlouhodobou udržitelnost práce',
    growth: 'Jaký realistický návyk podpoří tělo, čas nebo osobní zdroje',
  },
}

export const RANK_REFLECTION_ENDINGS: Record<number, string> = {
  1: 'a co je připravené teprve začít',
  2: 'a mezi kterými možnostmi potřebujete volit',
  3: 'a s kým nebo čím má smysl spolupracovat',
  4: 'a kde stabilita začíná být příliš těsná',
  5: 'a jak lze tvořivě odpovědět na současné narušení',
  6: 'a jak může vypadat spravedlivější rovnováha',
  7: 'a co stojí za trpělivou ochranu před rozptýlením',
  8: 'a kterou dovednost nebo omezení můžete dnes vědomě zpracovat',
  9: 'a jak přitom nepřekročit vlastní kapacitu',
  10: 'a co je čas završit, sdílet nebo přestat nést o samotě',
  11: 'a na co se můžete podívat očima zvídavého začátečníka',
  12: 'a jaké tempo povede správným směrem',
  13: 'a jak můžete vytvořit podmínky, které toto téma podpoří',
  14: 'a za kterou část výsledku jste ochotni převzít odpovědnost',
}

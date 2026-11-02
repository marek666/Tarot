import type { SpreadLayoutDefinition, SpreadLayoutId } from '../types/spread.ts'

export const SPREAD_LAYOUTS: Record<SpreadLayoutId, SpreadLayoutDefinition> = {
  timeline: {
    id: 'timeline',
    title: 'Minulost / Přítomnost / Možný vývoj',
    description: 'Sleduje, z čeho situace vyrůstá, co se děje nyní a kam může směřovat při zachování současného přístupu. Nejde o jistou předpověď.',
    positions: [
      {
        id: 'past',
        title: 'Minulost',
        shortTitle: 'Minulost',
        role: 'Vliv, zkušenost nebo rozhodnutí, které pomáhá pochopit výchozí bod.',
        readingLens: 'Čtěte kartu jako kořen současné situace, nikoli jako neměnnou příčinu všeho dalšího.',
        reflectionPrompt: 'Co z tohoto dřívějšího vlivu je stále užitečné a co už nemusíte opakovat',
      },
      {
        id: 'present',
        title: 'Přítomnost',
        shortTitle: 'Přítomnost',
        role: 'Hlavní energie, rozhodnutí nebo napětí, se kterým lze pracovat právě teď.',
        readingLens: 'Tato pozice pojmenovává současný způsob reagování a prostor, kde máte největší vliv.',
        reflectionPrompt: 'Která část současné situace vyžaduje vaši nejvědomější pozornost',
      },
      {
        id: 'development',
        title: 'Možný vývoj',
        shortTitle: 'Vývoj',
        role: 'Pravděpodobný směr při pokračování současného přístupu, nikoli pevně daná budoucnost.',
        readingLens: 'Karta ukazuje možnost a důsledek, které lze vlastním rozhodnutím podpořit, upravit nebo odmítnout.',
        reflectionPrompt: 'Který dnešní krok může tento směr podpořit nebo vědomě změnit',
      },
    ],
    connectionPrompt: 'Jak minulý vliv formuje přítomnou volbu a co se změní, když na něj odpovíte vědoměji?',
    finalPrompt: 'Jaký jeden krok v přítomnosti nejlépe propojí poučení z minulosti s vývojem, který chcete podpořit?',
  },
  situation: {
    id: 'situation',
    title: 'Situace / Překážka / Rada',
    description: 'Odděluje podstatu tématu, skutečné místo tření a praktický přístup, který může pomoci.',
    positions: [
      {
        id: 'situation',
        title: 'Situace',
        shortTitle: 'Situace',
        role: 'Podstata tématu a okolnosti, které je dobré nejprve vidět bez zjednodušení.',
        readingLens: 'Karta popisuje základní dynamiku situace a to, co je v ní právě nejvíc přítomné.',
        reflectionPrompt: 'Co tato karta zpřesňuje na vašem původním pohledu na situaci',
      },
      {
        id: 'obstacle',
        title: 'Překážka',
        shortTitle: 'Překážka',
        role: 'Vnitřní nebo vnější faktor, který komplikuje pohyb a zaslouží si přesnější pojmenování.',
        readingLens: 'Nečtěte ji automaticky negativně; může ukazovat chybějící zdroj, hranici nebo lekci, kterou nelze přeskočit.',
        reflectionPrompt: 'Je tato překážka spíš hranicí k respektování, dovedností k doplnění, nebo zvykem k přehodnocení',
      },
      {
        id: 'advice',
        title: 'Rada',
        shortTitle: 'Rada',
        role: 'Užitečný postoj nebo konkrétní způsob, jak se situací pracovat bez slibu výsledku.',
        readingLens: 'Karta nabízí princip k vyzkoušení; rada má být přiměřená vašim možnostem a skutečným okolnostem.',
        reflectionPrompt: 'Jak lze tuto radu převést do jednoho realistického a ověřitelného kroku',
      },
    ],
    connectionPrompt: 'Jak překážka mění vaše chápání situace a proč právě navržená rada odpovídá tomuto místu tření?',
    finalPrompt: 'Jaký nejmenší proveditelný krok respektuje překážku a současně posune situaci užitečným směrem?',
  },
  relationship: {
    id: 'relationship',
    title: 'Já / Druhá strana / Vzájemná dynamika',
    description: 'Pomáhá rozlišit vlastní postoj, možný pohled druhé strany a vzorec vznikající mezi nimi. Nenahrazuje otevřený rozhovor.',
    positions: [
      {
        id: 'self',
        title: 'Já',
        shortTitle: 'Já',
        role: 'Váš postoj, potřeba, očekávání nebo způsob, kterým do vztahové situace vstupujete.',
        readingLens: 'Karta obrací pozornost k tomu, co můžete rozpoznat a ovlivnit na své vlastní straně.',
        reflectionPrompt: 'Co potřebujete přiznat, vyjádřit nebo upravit ve vlastním přístupu',
      },
      {
        id: 'other',
        title: 'Druhá strana',
        shortTitle: 'Druhá strana',
        role: 'Možný pohled, potřeba nebo okolnost druhé strany; karta netvrdí, že znáte její myšlenky.',
        readingLens: 'Použijte ji jako hypotézu pro empatii a otázku, kterou lze ověřit rozhovorem, ne jako důkaz cizích úmyslů.',
        reflectionPrompt: 'Na co se můžete druhé strany otevřeně zeptat místo vytváření domněnky',
      },
      {
        id: 'dynamic',
        title: 'Vzájemná dynamika',
        shortTitle: 'Dynamika',
        role: 'Vzorec, který vzniká setkáním obou postojů a který mohou obě strany spoluvytvářet.',
        readingLens: 'Karta ukazuje kvalitu výměny mezi stranami a prostor pro změnu komunikace nebo hranic.',
        reflectionPrompt: 'Který opakující se vzorec mezi vámi potřebuje pojmenovat a co by vytvořilo zdravější výměnu',
      },
    ],
    connectionPrompt: 'Jak se váš postoj setkává s možnou zkušeností druhé strany a jaký vzorec tím společně vzniká?',
    finalPrompt: 'Jakou jednu otevřenou otázku nebo hranici můžete přinést do rozhovoru, aniž byste předem určovali odpověď druhého?',
  },
}

export const SPREAD_LAYOUT_LIST = Object.values(SPREAD_LAYOUTS)

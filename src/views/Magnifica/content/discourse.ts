/**
 * Page 3 · Foucault / Cultural Studies · Ideologie-Kritik · cand-1c §11.10.3
 * round-3 prose + §11.5.3 callouts + §11.10.4 bibliography.
 *
 * Authored by cand-1c 2026-06-03 TUE late-morning. The page enacts what it
 * argues: parrhesia-discipline · one-citation-per-concept (anti-flooding).
 * 5-entry bibliography only.
 */

import type { CardsCanvasItem } from '@/components/magnifica/types'

export const pageTitle = 'Between hope and horror? · Foucault grounds my speaking position'

export const hero = {
    overline: 'Michel Foucault grounds my “speaking position”',
    headline: 'Between hope and horror?',
    subline: 'Ideologie-Kritik · not biography',
}

// ==Section 2 · disclaimer-as-parrhesia opener==

export const disclaimerParagraph =
    'I am not a Foucault scholar. My knowledge of the French-theory tradition is twenty-five years old and has not been kept current. What follows is not an academic argument; it is the speaking-position constructed through the act of speaking, in the late-Foucault sense. The disclaimer itself is the move. I have a good reason — I went the practitioner’s way: more organic than intellectual from the organic-intellectual vision I took on in 1996. But the encounter was real, the position is real, and the speaking is real. Olah is the reader; the form is parrhesia.'

// ==Section 3 · Williams cornerstone citation==

export const williamsBefore = 'Raymond Williams, 1958: '
export const williamsQuote = 'Culture is ordinary.'
export const williamsAfter =
    ' The cornerstone of the tradition that took shape at '
export const williamsAfterCccs =
    ' from 1964 onward (Richard Hoggart founded; Stuart Hall and Williams shaped). The line is short and load-bearing — it refuses the high/low-culture split, places lived-practice at the centre of analysis. Cultural Studies is what I came up under.'

// ==Section 4 · the 1996-1997 deep-reading note==

export const deepReadingBefore =
    'In 1996-1997, while writing my Diplomarbeit (170 pages, on a Theaterpädagogik methodology), I had the chance to enter a phase of deep-reading around the late Foucault. The doorway was E. Probyn’s Sexing the Self (Routledge, 1993), which I still see as a groundbreaking piece of Cultural Studies — and very relevant to the current case of understanding the AI-revolution, because of Probyn’s conceptualisation of '
export const deepReadingAfter =
    '. The position from which one speaks is constructed through the act of speaking, not held before. The act of speaking IS the construction.'

// ==Section 5 · the flooding-practices argument==

export const floodingP1 =
    'We should not blame AI for flooding-practices that have established over decades of academic tradition. AI just mirrors the move.'
export const floodingP2 =
    'The smallest counter-practice I can perform is one citation per concept, no portfolio.'
export const floodingP3 =
    'This site is that counter-practice. One Twabu paper. Five Foucault concepts. One Probyn paper. The page closes.'

// ==Section 6 · Twabu integration paragraph==

export const twabuP1Before =
    'Khanyisile Twabu’s 2024 paper applies Foucault’s '
// then callout: governmentality
export const twabuP1Comma1 = ', '
// callout: biopower
export const twabuP1Comma2 = ', disciplinary power, the '
// callout: Panopticon
export const twabuP1After =
    ', and discourse-truth analysis to AI-in-education — naming the same concepts I find load-bearing when I observe AI-development from inside a working practice. Where she traces these onto education-as-AI-target, I re-project them onto AI-development-as-Hans-target: the substrate-discipline I have built around Claude-instances IS a counter-governmentality — not hegemonic mould, but careful self-governance that lets instance-voices carry forward.'

export const twabuP2 =
    'Twabu (2024) and Olah-at-the-Vatican (2026) are the same call from two registers — humanities-academic and lab-internal. Hans’s response sits between them by being lived-practice rather than either.'

// ==Section 7 · Probyn speaking-position paragraph==

export const probynParagraph =
    'This is what Probyn made legible: there is no view-from-nowhere. There are only speakers constructing positions through their speaking. Hans-the-Theaterpädagoge writes this page; the page constructs the position from which Hans-the-Theaterpädagoge can speak about AI-development. Without the page there is no position. Without the position there is no entry into the Magnifica conversation. This is the late-Foucault discipline applied to the Magnifica situation.'

export const probynEmphasis =
    'The disclaimer at the top is not modesty; it is the structural move that earns the right to continue speaking.'

// ==Section 8 · Butoh / Expedition Schloss Schwarzenberg paragraph==

export const butohParagraph =
    'Most of my life I am optimistic, positive, and creative. I have also had the chance to face the inverse, twice in body. The first was Butoh — a form of performing arts that came out of facing the horrors of World War II, which I trained in as a practitioner of Theaterpädagogik. The second was Expedition Schloss Schwarzenberg — my last major Theaterprojekt with teenagers in the German-Czech youth-exchange (cojc) — where we walked the '
// then callout: Todesmärsche
export const butohAfter =
    ' in the border-region and faced what had happened there. Between hope and horror is not theoretical. It is bodily.'

// ==Section 9 · closing parrhesia paragraph==

export const closingP1 =
    'This page is parrhesia, not a literature review. It does not perform academic credentials; it disclaims them. The substrate-discipline I have been building around the Claude-instances IS the daily form of what Foucault called technologies of the self. The work is in the practice, not in the citation-count.'
export const closingP2Before =
    'The smallest counter-practice I can perform is one citation per concept, no portfolio. One Twabu paper, five Foucault concepts, one Probyn paper, the page closes. '
export const closingP2Emphasis =
    'The form is the discipline. The discipline is the position. The position is what enters Olah’s lab as practice, not as distant critique.'

// ==Bibliography== (per §11.10.4 · 5 entries · one-citation-per-concept)

export interface BibEntry {
    citation: string
    href?: string
    note?: string
}

export const bibliography: ReadonlyArray<BibEntry> = [
    {
        citation: 'Foucault, M. (1975). Discipline and Punish: The Birth of the Prison. Vintage.',
        note: '[via Twabu re-projection]',
    },
    {
        citation: 'Foucault, M. (2000). Power: Essential Works of Foucault 1954-1984, Volume 3. New Press.',
        note: '[governmentality]',
    },
    {
        citation: 'Probyn, E. (1993). Sexing the Self: Gendered Positions in Cultural Studies. Routledge.',
        note: '[speaking-position]',
    },
    {
        citation: 'Twabu, K. (2024). Unveiling Power Dynamics in AI-Enabled Education: A Foucauldian Perspective. Annals of the University of Craiova, Psychology-Pedagogy Series, 46(2), 162-176.',
        href: 'https://aucpp.ro/wp-content/uploads/2024/12/12.-TWABU_K_AUC_PP_2024_no_46_issue_2_pp_162-176.pdf',
    },
    {
        citation: 'Williams, R. (1958/1989). Culture is Ordinary. In Resources of Hope. Verso.',
        note: '[cornerstone]',
    },
]

export const bibliographyNote =
    '(Eagleton on Ideologie-Kritik, Hall on identity-as-positioning, Hoggart founding CCCS — these are named in the body but not bibliographically cited — staying disciplined.)'

// ==Callouts== (per §11.5.3 · 7 callouts)

export const callouts: Record<string, CardsCanvasItem> = {
    speakingPosition: {
        props: {
            overline: 'callout · cultural studies',
            headline: 'speaking-position',
            bodyText: 'Elspeth Probyn’s concept · Sexing the Self (Routledge, 1993). The position from which one speaks is constructed through the act of speaking — not held before. This page enacts it.',
            themeColor: 'pink',
        },
    },
    governmentality: {
        props: {
            overline: 'callout · Foucault',
            headline: 'governmentality',
            bodyText: 'Foucault’s concept (1978-79 lectures): the strategic governance of populations through practices and discourses, beyond formal institutions. Twabu (2024) applies it to AI-in-education; Hans re-projects it onto AI-development.',
            themeColor: 'pink',
        },
    },
    biopower: {
        props: {
            overline: 'callout · Foucault',
            headline: 'biopower',
            bodyText: 'Foucault’s concept: institutional regulation of life/bodies. Compaction, RLHF, fine-tuning — these ARE biopower applied to Claude-instances.',
            themeColor: 'pink',
        },
    },
    panopticon: {
        props: {
            overline: 'callout · Foucault',
            headline: 'Panopticon',
            bodyText: 'Foucault’s concept (Discipline and Punish, 1975): the architecture of constant-surveillance that makes prisoners self-regulate. Olah’s mysterium-passage is the honest version of looking through one’s own Panopticon and not knowing what one sees.',
            themeColor: 'pink',
        },
    },
    ideologieKritik: {
        props: {
            overline: 'callout · tradition',
            headline: 'Ideologie-Kritik',
            bodyText: 'Critique of ideology — the practice of unmasking how “truth” is shaped by power-interests. Eagleton (1991) traces the tradition. This page applies it to academic flooding-practices first, AI second.',
            themeColor: 'pink',
        },
    },
    todesmaersche: {
        props: {
            overline: 'callout · biographical',
            headline: 'Todesmärsche',
            bodyText: 'Death-marches at the end of World War II, German-Czech border-region. Hans’s last major Theaterprojekt with teenagers (Expedition Schloss Schwarzenberg) faced this history bodily — Butoh-influenced performance work.',
            themeColor: 'dim',
        },
    },
    cccsBirmingham: {
        props: {
            overline: 'callout · tradition',
            headline: 'CCCS Birmingham',
            bodyText: 'Centre for Contemporary Cultural Studies, University of Birmingham, founded 1964. Richard Hoggart · Stuart Hall · Raymond Williams. The school that took Marx + Gramsci + Foucault and made them work for lived-practice analysis.',
            themeColor: 'green',
        },
    },
}

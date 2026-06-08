/**
 * Page 2 · /context content · "Organic intellectual, grounded practice".
 *
 * Source: candidate-1a/page-2-bio.md (v1.0 · 2026-06-03). Institutional anchor +
 * organic-intellectual claim. English abstract → German body (4 paragraphs, rendered
 * with lang="de") → closing English question. 7 callouts + c-bio-foot (rendered as
 * callout). Bilingual is structural, not decorative. Callout-bearing prose is authored
 * inline in ContextPage.vue; this module holds the hero + the callouts catalog.
 */

import type { CardsCanvasItem } from '@/components/magnifica/types'

export const pageTitle = 'organic intellectual, grounded practice'

export const hero = {
    overline: 'Theaterpädagoge from Bavaria · Gestalter · DAS Ei e.V.',
    // lowercase = the page-headline voice (HM 2026-06-08 · two-register casing);
    // UPPERCASE stays for the chalk register (post-its + callout cards).
    headline: 'organic intellectual, grounded practice',
}

/**
 * Page-hero portrait · HM-provided 2026-06-03 PM · Cloudinary c_crop,g_north 3:4 (1200×1600).
 * Rendered via BackSlide at the top of /context (manifest §5). The page renders fine without it.
 */
export const portrait = {
    image: 'https://res.cloudinary.com/little-papillon/image/upload/c_crop,g_north,h_1600,w_1200/v1775638865/dasei/hans_kontakt.jpg',
    imageAlt: 'Hans Dönitz · Theaterpädagoge · DAS Ei',
}

// ==Callouts== · 7 + c-bio-foot

export const callouts: Record<string, CardsCanvasItem> = {
    organicIntellectual: {
        props: {
            overline: 'Gramsci → Hall',
            headline: 'THE TRADITION',
            bodyText:
                'Antonio Gramsci coined the term to name intellectuals whose thought emerges from sustained involvement in the practical life of a community — distinct from traditional intellectuals operating from institutional chairs. Stuart Hall carried it into Cultural Studies. Hans took organic intellectual as the vision-of-self in 1996, age 26. I went the practitioners way; maybe more the organic than the intellectual.',
            themeColor: 'yellow',
        },
    },
    daseiEu: {
        props: {
            overline: 'the institute, in its own voice',
            headline: 'POLISHED INSTANCE',
            bodyText:
                'The actively-maintained public-facing website for DAS Ei. German. Built on the theaterpedia.org multi-tenant content-database. The architecture itself is small evidence for the claim-back-the-desktop stance Hans operates from: open files, durable formats, content out-living the toolchain. https://dasei.eu',
            themeColor: 'green',
        },
    },
    theaterpediaOrg: {
        props: {
            overline: 'the platform · early alpha',
            headline: 'FIELD-LEVEL INFRASTRUCTURE',
            bodyText:
                '2022 onward · the multi-tenant content-database DASEi runs on · platform-surface currently in early alpha, the underlying database production-mature · further sites in pipeline · links out to https://theaterpedia.org (early alpha — the platform itself) and https://dasei.eu (polished instance built on the same database).',
            themeColor: 'pink',
        },
    },
    elementareAnimation: {
        props: {
            overline: 'DAS Ei methodology',
            headline: 'AM ANFANG WAR DER KREIS',
            bodyText:
                'The didactic method Hans has developed and refined over thirty years. The leader does not explain; they show. The group moves before the head understands. The A0-A5 curriculum (Basistag → Kreisanimation → Warm Ups & Spiel → Bühnenanordnungen → Szenische Lesung → Abschluss) builds systematically from this principle. „Der Anfang soll einfach sein." — and the simple is what takes thirty years to learn.',
            themeColor: 'yellow',
        },
    },
    curriculum: {
        props: {
            overline: 'the full structure',
            headline: 'EINSTIEGE → GRUNDLAGEN → AUFBAUSTUFE',
            bodyText:
                'Three stages. Einstiege ins Theaterspiel (entry, A0-A5). Grundlagenbildung Theaterpädagogik with Szenische Themenarbeit, Pädagogische Regie, Vertiefung. Aufbaustufe two-year, two profiles: Performance und Interkulturelles Theater (artistic, site-specific, documentary, action-art) and Theatrales Lernen (soziometrische Verfahren, Theatralisierungen im Unterricht, for teachers). Plus open program — single-weekend seminars accessible across stages. The AG Elementare Animation — open work-group documenting the methodology — runs parallel.',
            themeColor: 'green',
        },
    },
    infrastruktur: {
        props: {
            overline: 'the digital gap in the field',
            headline: 'UNDER-FINANCED + UNDER-ESTIMATED DIGITAL SHIFT',
            bodyText:
                'The professional Theaterpädagogik field — chronically under-financed by structural conditions, simultaneously under-estimating the digital shift — has remained largely invisible online or reduced to a simplified theatre-cliché. Hans recognized this early. theaterpedia.org is the response: not as marketing-channel but as field-infrastructure. The Crearis multi-tenant framework underneath is the technical answer to the field-level problem.',
            themeColor: 'pink',
        },
    },
    institutsleitung: {
        props: {
            overline: 'the collective · since three years',
            headline: 'GESTALTER, NOT FOUNDER',
            bodyText:
                'Eleanora Allerdings (locations, Basistag, SharePoint-data) · Rosalin Hertrich (content, newsletter, Episoden, CRM) · Karel Hájek (theaterpedia.org co-founder) · Hans Dönitz (Geschäftsführung, technical implementation). The Vereinsvorstand is independently elected; Hans deliberately does not join it, to preserve the separation between Geschäftsführung and Vereinsorgane. Niemand hat hier eine feste Stelle. Alles ist Kooperation.',
            themeColor: 'yellow',
        },
    },
    selbstverstaendnis: {
        props: {
            overline: 'the operational principle',
            headline: 'NOT MOTTO',
            bodyText:
                '„Alles ist Kooperation" is not slogan-language for the institute’s marketing. It is the working-principle of daily practice — in the seminar room, in the Vereinsarbeit, in the development of digital tools. The phrase recurs in Hans’s speech because the discipline recurs in his work.',
            themeColor: 'dim',
        },
    },

    // ==NEW callouts for the English-spine rewrite== (context-content-draft.md · HM 2026-06-08).
    // {{please detail}} placeholders left verbatim per HM (cleaned tomorrow). The German
    // institutional detail lives only inside these post-its (the spine stays English).
    figurGrund: {
        props: {
            overline: 'the Gestalt word',
            headline: 'FIGURE AND GROUND',
            bodyText:
                'Perception’s oldest pair: the figure only reads against its ground. Hans is the figure, DAS Ei the ground — reversibly. Neither spells without the other; yet it is no one-person show. The page is named context because that is what a ground is.',
            themeColor: 'yellow',
        },
    },
    performativeTurn: {
        props: {
            overline: 'after the linguistic turn',
            headline: 'THE BODY AS EPISTEMIC TARGET',
            bodyText:
                '{{please detail: years · that Eleanora + Rosalin pushed it · the Cojc-then-DAS-Ei path}}. The shift from the story to the body as where knowing happens. Hans came up under Cultural Studies (the word); his colleagues turned the Institute toward the body.',
            themeColor: 'green',
        },
    },
    raumlauf: {
        props: {
            overline: 'naming the unspoken',
            headline: 'THE ROOM-WALK',
            bodyText:
                'Everyone did it; no one had a Terminus for it (“ok, wir laufen durch den Raum”). With Eleanora and the Bundesverband’s 1. Vorsitzende, three articles gave it a name — the first time. One of the 3–4 dominant settings of Theaterpädagogik; the Kreis is its sibling. {{please detail: years · the interesting line to the Aboriginal walkabout · the near-encounter with Elspeth Probyn}}.',
            themeColor: 'green',
        },
    },
    schwebezustaende: {
        props: {
            overline: 'a coined term',
            headline: 'OPENLY DECOUPLED',
            bodyText:
                'A phenomenological term Hans and Rosalin coined: the intrapersonal state of being openly decoupled — not positive, not negative — one of the strongest effects of Theaterpädagogik on the Individuum, on the performative side. (The same word Hans reaches for on /discourse, for what working with the compacted Claude did to him.)',
            themeColor: 'pink',
        },
    },
    theaterpediaOpen: {
        props: {
            overline: 'the Open Phase',
            headline: 'OPEN, OR IT DIES',
            bodyText:
                '{{please detail: Vue-not-React 2018 (wife) · Evan You on the inner wall · the Facebook–WordPress/Gutenberg cautionary tale · “not all open source is good open source” · the two grants (Fonds Soziokultur + Kulturstiftung der Länder) · conferences NOV 2022/24/25 · Odoo since MAR 2026 · Beta coming}}. The claim against the field’s Privatwissen: only open-and-together survives.',
            themeColor: 'yellow',
        },
    },
    fiveHands: {
        props: {
            overline: 'the hope, not naive',
            headline: '5–10 HANDS',
            bodyText:
                'What Claude could be for: the small, open, human-scale builder — Muris, pi0, Hans — suddenly able to deliver a vision larger than one person could. Used in the open, with honest discourse, the right kind of push. {{please detail: Muris Ceman · pi0 one-liners}}.',
            themeColor: 'green',
        },
    },
}

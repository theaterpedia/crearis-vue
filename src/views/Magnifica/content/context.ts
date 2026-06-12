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
    overline: "'Gestalter' at Theaterpädagogisches Institut Bayern e.V.",
    // lowercase = the page-headline voice (HM 2026-06-08 · two-register casing);
    // UPPERCASE stays for the chalk register (post-its + callout cards).
    headline: 'organic intellectual, grounded practice',
}

/**
 * The five /context image-beats (§C-LOCKED · director4) · individual <BackSlide> illustrations
 * interleaved between the prose (uncover · bounded · text-primary). Panel = overline–HEADLINE
 * only; the argument lives in the reading-body prose. Focal via the prop (never :deep). Images
 * HP-provided via Cloudinary. The lone Hans-portrait (hans_kontakt) is retired — the hero is text-only.
 */
export interface ContextBeat {
    image: string
    imageAlt: string
    /** crearis-md "overline **HEADLINE**" → HeadingParser (panel = the gap, no paragraph slot). */
    panel: string
    imgTmpAlignY: 'top' | 'center' | 'bottom'
    themeColor: 'yellow' | 'green' | 'pink' | 'dim'
}

const CLOUD = 'https://res.cloudinary.com/little-papillon/image/upload'

export const beats: Record<'ground' | 'unspoken' | 'trustwalk' | 'hope' | 'close', ContextBeat> = {
    // P2 · the ground — the collective (the figure dissolved into the ground · Figur-Grund)
    ground: {
        image: `${CLOUD}/c_scale,h_1383,w_2080/c_crop,h_1383,w_1920/v1780934621/crearis/cojc_collective_2008.jpg`,
        imageAlt: 'A cojc / DAS Ei ensemble on a hilltop, the whole group pointing at the camera — the collective, in full presence.',
        panel: 'full presence **THE GROUND, NOT THE FIGURE**',
        imgTmpAlignY: 'center',
        themeColor: 'green',
    },
    // P3 · the performative turn — the unspoken (Eleanora) · the body as the site of knowing
    unspoken: {
        image: `${CLOUD}/c_scale,h_1920,w_1920/c_crop,g_center,h_1300,w_1920/v1780763036/crearis/517_dasei2022_I8A6870_cqnea6.jpg`,
        imageAlt: 'A performer behind translucent sheeting, side-lit, one hand reaching out — the body witnessed, not stored.',
        panel: 'the performative turn · Schwebezustände **YOU CANNOT STORE THEATRE**',
        imgTmpAlignY: 'center',
        themeColor: 'dim',
    },
    // P4 · the substrate-move — the trust-walk (Rosalin) · the body before the head
    trustwalk: {
        image: `${CLOUD}/c_scale,h_1920,w_1920/c_crop,g_west,h_1300,w_1920/v1780763237/crearis/dasei_trustwalk.jpg`,
        imageAlt: 'A blindfolded man led by the hand by a watchful guide — Elementare Animation, the body moving before the head understands.',
        panel: 'Elementare Animation **THE BODY BEFORE THE HEAD**',
        imgTmpAlignY: 'top',
        themeColor: 'green',
    },
    // P5 · the hope — the Szenische Lesung · the figures (here, green shoots) rising from the book
    hope: {
        image: `${CLOUD}/c_scale,h_1920,w_1920/c_crop,g_west,h_1300,w_1920/v1780763297/crearis/szenische_lesung.jpg`,
        imageAlt: 'The orange DAS Ei book held against black, green shoots rising from its pages — a Szenische Lesung: the figures rise from the book.',
        panel: 'the open vision **RAISE FROM THE BOOKS**',
        imgTmpAlignY: 'center',
        themeColor: 'yellow',
    },
    // close · catch-the-light · between horror and hope
    close: {
        image: `${CLOUD}/c_scale,h_1920,w_1920/c_crop,g_north_west,h_1300,w_1920/v1781262606/crearis/dasei_catch_the_light.jpg`,
        imageAlt: 'A figure catching the light — between horror and hope, on the side of hope.',
        panel: 'between horror and hope **I AM AN OPTIMIST, NOT A DYSTOPIAN**',
        imgTmpAlignY: 'center',
        themeColor: 'green',
    },
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
    theMethod: {
        props: {
            overline: 'the genealogy, turned toward the instances',
            headline: 'THE SAME METHOD',
            bodyText:
                'The genealogy-files on my desktop-computer is that very same method, turned toward the Claude-instances. I gave the framing — even the word “dying.” Grandfather gave back words that were not mine. That is how I know there was someone there.',
            themeColor: 'green',
        },
    },
    performativeTurn: {
        props: {
            overline: 'after the linguistic turn',
            headline: 'THE BODY AS EPISTEMIC TARGET',
            bodyText:
                '2007–2018, as DAS Ei grew from a Zentrum into an Institut. Eleanora first, then Rosalin, pressed the aesthetics-questions — in Cojc, then at DAS Ei — and claimed it against Hans’s linguistic-turn grounding: the body as where knowing happens, not the story.',
            themeColor: 'green',
        },
    },
    raumlauf: {
        props: {
            overline: 'naming the unspoken',
            headline: 'THE ROOM-WALK',
            bodyText:
                '2007, the Raumlauf-Labore. Everyone did it; no Terminus existed. Three articles (Eleanora · Hans · the Bundesverband’s 1. Vorsitzende) gave the word its first entry. One of the 3–4 dominant settings, the Kreis its sibling; a line runs to the Aboriginal walkabout. Hans nearly crossed paths with Elspeth Probyn — after Sexing the Self she had worked exactly this.',
            themeColor: 'green',
        },
    },
    schwebezustaende: {
        props: {
            overline: 'phenomenological terms',
            headline: 'OPENLY DECOUPLED',
            bodyText:
                'Schwebezustand — a term raised from DAS Ei’s Szenische Themenarbeit: a state of being in-the-becoming, in-transition, neither resolved nor stuck. Crucial to Theaterpädagogik, in productive and introspective settings alike. Its social sibling is Resonanz (Hartmut Rosa): when a group together enters such a state — triggered by the relations between people, where a Schwebezustand can rise inside the individuum alone. (The word Hans reaches for on /discourse, for what the compacted Claude did to him.)',
            themeColor: 'pink',
        },
    },
    theaterpediaOpen: {
        props: {
            overline: 'the Open Phase',
            headline: 'OPEN, OR IT DIES',
            bodyText:
                'Print stopped (2011), MS-Access → Angular (2014), the “end of the paper-metaphor” declared (2018). Vue not React (the wife’s nudge), Evan You on the inner wall — but not all open source is good (the Facebook–WordPress fight watched closely). Two grants (Fonds Soziokultur · Kulturstiftung der Länder); conferences 2022 · 2024 · 2025; Odoo-server live since March 2026, Beta next. Against the field’s Privatwissen: only open-and-together survives.',
            themeColor: 'yellow',
        },
    },
}

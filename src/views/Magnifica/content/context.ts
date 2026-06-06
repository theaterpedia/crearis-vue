/**
 * Page 2 · /bio content · cand-1a · "Organic intellectual, grounded practice".
 *
 * Source: candidate-1a/page-2-bio.md (v1.0 · 2026-06-03). Institutional anchor +
 * organic-intellectual claim. English abstract → German body (4 paragraphs, rendered
 * with lang="de") → closing English question. 7 callouts + c-bio-foot (rendered as
 * callout). Bilingual is structural, not decorative. Callout-bearing prose is authored
 * inline in BioPage.vue; this module holds the hero + the callouts catalog.
 */

import type { CardsCanvasItem } from '@/components/magnifica/types'

export const pageTitle = 'Organic intellectual, grounded practice'

export const hero = {
    overline: 'Theaterpädagoge from Bavaria · Gestalter · DAS Ei e.V.',
    headline: 'ORGANIC INTELLECTUAL, GROUNDED PRACTICE',
}

/**
 * Page-hero portrait · HM-provided 2026-06-03 PM · Cloudinary c_crop,g_north 3:4 (1200×1600).
 * Rendered via BackSlide at the top of /bio (manifest §5). The page renders fine without it.
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
                'Antonio Gramsci coined the term to name intellectuals whose thought emerges from sustained involvement in the practical life of a community — distinct from traditional intellectuals operating from institutional chairs. Stuart Hall carried it into Cultural Studies. Hans took organic intellectual as the vision-of-self in 1996, age 24. I went the practitioners way; maybe more the organic than the intellectual.',
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
}

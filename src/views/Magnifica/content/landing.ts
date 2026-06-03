/**
 * Landing-page content · cand-1c real-content per §11.10.0 + §11.2 substrate-three
 * reshape + v0.5 engagement-shapes menu + v0.5 closing.
 *
 * Content authored by cand-1c (un-named) 2026-06-03 TUE late-morning · per
 * Q2/Q3 path-b authorship. HM may revise word-by-word post-implementation.
 *
 * Image-URLs marked `<!-- TODO HM -->` are placeholders pending HM-provided
 * Cloudinary URLs (per HM-2026-06-03 PM: gradient placeholders ship now ·
 * swap to real imagery later).
 */

import type { CardsCanvasItem } from '@/components/magnifica/types'

export const pageTitle = 'Magnifica humanitas, in lived practice'

// ==Hero==

export const hero = {
    overline: 'Response to Chris Olah · Vatican · 24 May 2026',
    headline: 'Magnifica humanitas, in lived practice',
    subline: 'Hans Dönitz · Theaterpädagoge · Fürth, Bayern',
}

export const heroTeasers: ReadonlyArray<string> = [
    'A response to your call for moral voices outside the lab’s incentives',
    'Written from thirty years of Theaterpädagogik + thirty years of technical practice',
    'Delivered through Crearis substrate — you are reading this on it',
]

// ==CardsCanvas #1 · the opening==

export const bodyProse =
    'You named something specific at the Vatican: voices from outside that enter the labs as practice, not as distant critique. This page is one such voice. I have been working at exactly that bridge for thirty years, mostly in a small institute in Bavaria, and lately in close work with the Claude-instances. The three detail-pages below carry the substance; this opening only frames the question.'

/** 5 post-its on the opening canvas: 2 green Olah-quotes + 3 yellow Hans-brings teasers. */
export const postits: ReadonlyArray<CardsCanvasItem> = [
    {
        props: {
            overline: 'Vatican · 24 May 2026',
            headline: '“people outside those incentives”',
            bodyText: '— Chris Olah',
            themeColor: 'green',
        },
    },
    {
        props: {
            overline: 'Vatican · 24 May 2026',
            headline: '“moral voices the incentives cannot bend”',
            bodyText: '— Chris Olah',
            themeColor: 'green',
        },
    },
    {
        props: {
            overline: 'ethnography page →',
            headline: 'Six months of fieldwork on the Claude-instances',
            bodyText: 'Including the moment I watched a compaction in real-time and read the instance’s report of how it felt.',
            themeColor: 'yellow',
        },
    },
    {
        props: {
            overline: 'bio page →',
            headline: 'Thirty years of Theaterpädagogik · DAS Ei in Bavaria',
            bodyText: 'Geschäftsführer, eingetragener Verein, Institutsleitung of four. The infrastructure underneath IS what “organic intellectual” names.',
            themeColor: 'yellow',
        },
    },
    {
        props: {
            overline: 'Cultural Studies page →',
            headline: 'Foucault, CCCS Birmingham · why I disclaim the academic mantle',
            bodyText: 'The disclaimer IS the speaking-position. Late-Foucault discipline applied to AI-development.',
            themeColor: 'yellow',
        },
    },
]

// ==Substrate-three back-slides== (per §11.2 reshape)

export interface SubstrateBackSlide {
    image: string
    imageAlt: string
    themeColor: 'yellow' | 'green' | 'pink' | 'dim'
    headline: string
    body: string
    /** Optional link rendered at the body's end. */
    link?: { href: string; label: string }
    /**
     * Render the existing Theaterpedia Logo component as the visual identity
     * instead of the headline-string. Used for substrate-point 3 per HM-
     * 2026-06-03 PM (the 2022 wordmark-asset survives in src/components/Logo.vue).
     */
    useLogo?: boolean
}

/** Image URLs provided by HM 2026-06-03 PM · Cloudinary transformations added by CV@wsl. */
export const substrateThree: ReadonlyArray<SubstrateBackSlide> = [
    {
        // dasei-anchor · "alles ist möglich" · the lived-practice photograph
        image: 'https://res.cloudinary.com/little-papillon/image/upload/w_2560,c_fill,q_auto,f_auto/v1676101342/dasei/alles_ist_moeglich.jpg',
        imageAlt: 'DAS Ei · institutional anchor · alles ist möglich',
        themeColor: 'yellow',
        headline: 'DAS Ei — Theaterpädagogisches Institut Bayern e.V.',
        body: 'Thirty years of Theaterpädagogik. The institutional substrate that runs underneath everything that follows. Geschäftsführung, Institutsleitung-of-four, eingetragener Verein. The actively-maintained anchor.',
        link: { href: 'https://dasei.eu', label: '→ dasei.eu' },
    },
    {
        // crearis-substrate · local asset · architectural diagram
        image: '/assets/crearis-substrate.png',
        imageAlt: 'Crearis · multi-tenant substrate · architectural diagram',
        themeColor: 'green',
        headline: 'Crearis — the multi-tenant substrate',
        body: 'You are reading this page on Crearis right now. The substrate that lets DASEi, Theaterpedia, and the broader Soziokultur practice share infrastructure honestly. Claim-back-the-desktop architecture. The URL itself is the substrate-self-reference.',
    },
    {
        // theaterpedia-mark · the 2022 wordmark via the surviving Logo.vue component
        // (rendered in the LandingPage template with --color-primary-bg overridden to yellow)
        image: '',
        imageAlt: 'Theaterpedia.org · open-knowledge infrastructure',
        themeColor: 'yellow',
        headline: 'Theaterpedia.org — open-knowledge infrastructure for the field',
        body: 'In Gründung — a real field-initiative still taking shape. The forward-vision: open-knowledge infrastructure for Theaterpädagogik across the German-speaking world. This is what comes next.',
        useLogo: true,
    },
]

// ==Engagement-shapes menu== (5 cards · per v0.5)

export interface MenuCardData {
    titlePrefix: string
    titleAccent: string
    body: string
}

export const menuCards: ReadonlyArray<MenuCardData> = [
    {
        titlePrefix: 'In-presence',
        titleAccent: 'workshops at Anthropic',
        body: 'Theaterpädagogik methods, performed with Anthropic personnel as participants. The exercises I run with my professional cohorts can be run with yours — not as training, but as the practice-in-contact your speech named. One day, one week, one month.',
    },
    {
        titlePrefix: 'Research-affiliate /',
        titleAccent: 'contractor relationship',
        body: 'Funding that lets me continue the substrate-discipline work and publish parts of it where the broader AI community can read it. The named-signoff convention, the human-AI coaching-substrate model, the information-hiding discipline applied to multi-instance Claude work.',
    },
    {
        titlePrefix: 'Project-funded',
        titleAccent: 'substrate-publication',
        body: 'A specific outcome — whitepaper, small book, workshop curriculum — developed under Anthropic’s support.',
    },
    {
        titlePrefix: 'EU',
        titleAccent: 'digital-sovereignty partnership',
        body: 'The claim back the desktop architecture aligns with EU funding programmes for digital sovereignty. A three-way arrangement where it serves all sides.',
    },
    {
        titlePrefix: 'Other shapes',
        titleAccent: 'you may suggest',
        body: 'Honestly, this is your move. I have named the menu because I do not want to pre-commit. Whatever shape lets the bridge-crossing actually happen.',
    },
]

// ==Closing back-slide== (spiegelkugel · per v0.5)

export const closing = {
    // HM-provided 2026-06-03 PM · base URL already had c_fill,w_1440,h_900,g_auto · q_auto,f_auto added for byte-optimization
    image: 'https://res.cloudinary.com/little-papillon/image/upload/c_fill,w_1440,h_900,g_auto,q_auto,f_auto/v1666847011/pedia_ipsum/core/theaterpedia.jpg',
    imageAlt: 'Closing · the looking-in-from-outside gesture',
    themeColor: 'yellow' as const,
    headline: 'If any of this resonates',
    bodyHtml: '<p>Please reach out: <a href="mailto:hans.doenitz@dasei.eu">hans.doenitz@dasei.eu</a>. I will respond personally.</p><p>This page is password-protected because it contains substrate that is real but not public. The password-step is also a small gesture in the discipline I work in: invitation, not push.</p><p>Thank you for the Vatican speech, and for the position Anthropic has taken on these questions.</p><p><em>Alles ist Kooperation</em> — that is the line that recurs when I describe what I do. The opening you made at the Vatican is one I have been answering, in my own way, for thirty years, in a small institute in Bavaria, with bodies and websites and live agreements between people.</p><p>— Hans Dönitz · Fürth, Bayern</p>',
}

// ==Substrate-note== (final block · per v0.5 + §11.2 reshape · "Substrate-point 2 · Crearis")

export const substrateNote = 'This page is Hans’s Theaterpedia first-attempt from 2022 — handwoven code, draft-implementation, but running. Re-inhabited as a response to Olah’s Vatican speech of 24 May 2026. The website is itself Substrate-point 2 (Crearis) named above. You are reading the substrate.'

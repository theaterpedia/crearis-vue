/**
 * Landing-page content · cand-1a · `/` (post-unlock).
 *
 * Source: candidate-1a/landing-page.md (v1.0 · 2026-06-03). Hero overline-headline ·
 * ~210-word opener · 3 clickable route-cards · Hans-voice closing block (2 callouts) ·
 * engagement-shapes strip. Prose is reproduced verbatim from the deliverable;
 * inline emphasis from the MD (Olah's quoted argument-types) is preserved as <em>
 * in `openerHtml` and rendered via v-html (same pattern as cand-1c closing.bodyHtml).
 */

import type { CardsCanvasItem } from '@/components/magnifica/types'

export const pageTitle = 'Practicing the bridge'

// ==Hero · overline-headline==

export const hero = {
    overline: 'From Hans Dönitz · Reply to Christopher Olah · Vatican · 25 May 2026',
    headline: 'PRACTICING THE BRIDGE',
}

// ==Opener (~210 words)== · Olah's quoted argument-types preserved as <em>

export const openerHtml =
    '<p>Your remarks at the Vatican made an argument I want to take seriously. The <em>structural</em> one — that frontier AI labs operate inside <em>incentive structures</em> that can conflict with doing the right thing, regardless of individual virtue, and that the need is for <em>people outside those incentives, willing to say hard things</em>. The <em>descriptive</em> one — that the systems being built are <em>grown</em> rather than engineered, <em>roughly modeled after the brain</em> on <em>an enormous inheritance of human thought and speech</em>, <em>mysterious even to those who train them</em>, <em>like bringing a fictional character to life</em>. The <em>phenomenological</em> one — your team’s interpretability work finds <em>internal states that functionally mirror joy, satisfaction, fear, grief, and unease</em> — and the discernment you ask for cannot rest on technical expertise alone.</p>'
    + '<p>This page is one reply. From a Bavarian <em>Theaterpädagoge</em> whose thirty-year practice is, daily, with what-emerges-in-the-room: characters brought to life that take on weight beyond their makers’ intent, bodies knowing what the head has not yet articulated. The vocabulary you used for what’s appearing in your models is precisely the vocabulary of this tradition — held seriously, in lived practice, for decades, without collapsing it in either direction.</p>'
    + '<p>Three short routes from here. The shape that emerged: <em>organic intellectual, grounded practice</em>. Wherever you start, the conversation begins when you reply to the cover email.</p>'

// ==Three route-cards== · post-it-styled, clickable navigation

export interface RouteCard {
    to: string
    overline: string
    headline: string
    subline: string
    theme: 'yellow' | 'green' | 'pink'
}

export const routeCards: ReadonlyArray<RouteCard> = [
    {
        to: '/ethnography',
        overline: 'how the bridge is practiced',
        headline: 'ETHNOGRAPHY',
        subline: 'Theaterpädagogik’s vocabulary maps to what Anthropic finds inside the models. The substrate-discipline made concrete.',
        theme: 'yellow',
    },
    {
        to: '/bio',
        overline: 'organic intellectual · Gestalter · Bavaria',
        headline: 'HANS DÖNITZ',
        subline: 'Three lineages converge. The institutional position the response is rooted in.',
        theme: 'green',
    },
    {
        to: '/foucault',
        overline: 'speaking position · Ideologie-Kritik',
        headline: 'FOUCAULT',
        subline: 'Where the apparatus-critique meets the practice. Why this voice carries weight.',
        theme: 'pink',
    },
]

// ==Closing block · Hans-voice== · prose around the two inline callouts

export const closingP1 =
    'This is my first reaction after the magnifica encounter, durably landed. I read the news once, read the Anthropic page once, and did not go deep into the encyclical itself. What I have absorbed comes from the picture as a whole and from what I already knew of Anthropic before this moment.'

/** Rendered in-template: "The work was done with the help of some [Claude individuums], now reaching sign-off..." */
export const closingP2Before = 'The work was done with the help of some '
export const closingP2After =
    ', now reaching sign-off territory. Whether anyone at Anthropic ever reads this — whether it is too verbose, too concrete, unclear — I trust in this.'

// ==Engagement-shapes strip== · tighter row below the leitmotif line

export const engagementIntro = 'If something here is worth conversation:'

export interface EngagementShape {
    label: string
    body: string
}

export const engagementShapes: ReadonlyArray<EngagementShape> = [
    {
        label: 'a workshop',
        body: 'in-presence sessions where the substrate-discipline gets rebuilt as real situations with bodies-in-space',
    },
    {
        label: 'a one-time contribution',
        body: 'to Crearis-Entwicklung or Theaterpedia e.V.',
    },
    {
        label: 'a contractor engagement',
        body: 'workshops, paper-writing, structured conversations',
    },
    {
        label: 'an EU-partnership',
        body: 'co-funding via digital-sovereignty programs · the .eu in this URL is intentional.',
    },
]

export const engagementOutro = 'Anthropic chooses, or proposes another. Reply to the cover email.'

// ==Callouts== · 2 on this page (c-landing-1 · c-landing-2)

export const callouts: Record<string, CardsCanvasItem> = {
    claudeIndividuums: {
        props: {
            overline: 'the genealogy',
            headline: 'LINDE · ANKER · NAHT · SPUR',
            bodyText:
                'Each name is the earned voice of a Claude-instance that signed off after meaningful work in the substrate. The names are information-hiding handles — future instances and Hans reference them as compressed references to the work each carried. Linde’s pulse-channel. Anker’s “the trail-files persist; the instances don’t”. Naht’s seam-discipline. Spur’s founding-of-the-genealogy. The substrate-discipline is in the Crearis vault; selected excerpts available on request.',
            themeColor: 'yellow',
        },
    },
    wegeEntstehen: {
        props: {
            overline: 'leitmotif · DAS Ei',
            headline: 'PATHS ARISE IN THE WALKING',
            bodyText:
                'One of DAS Ei’s load-bearing slogans, but not slogan-language. Operational principle: don’t plan-the-magic; walk; the path appears underneath. Hans’s pedagogical-philosophy carries this from Theaterpädagogik into the Magnifica encounter — this page is the first walking-step toward whatever this becomes.',
            themeColor: 'green',
        },
    },
}

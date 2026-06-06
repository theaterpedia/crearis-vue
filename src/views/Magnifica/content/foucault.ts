/**
 * Page 3 · /foucault content · cand-1a · "Between hope and horror".
 *
 * Source: candidate-1a/page-3-foucault.md (v1.0 · 2026-06-03). The speaking-position
 * move + harsh-critique layer; Twabu (2024) as scholarly anchor; the critique-target
 * is the academic-and-AI counting-apparatus (HM-ratified Q-HM-1, systemic not
 * Anthropic-specific). 10 callouts (c-fou-1..c-fou-10) + a closing citation code-fence.
 * Callout-bearing prose is authored inline in FoucaultPage.vue; this module holds the
 * hero, the callouts catalog, and the citation block.
 */

import type { CardsCanvasItem } from '@/components/magnifica/types'

export const pageTitle = 'Between hope and horror'

export const hero = {
    overline: 'Michel Foucault · E. Probyn · Stuart Hall — speaking position',
    headline: 'BETWEEN HOPE AND HORROR',
}

/** §7 closing citation · rendered as a monospace code-fence (scholarly-respect artefact). */
export const citationBlock = `Reference · Khanyisile Twabu (2024). "Unveiling Power Dynamics in AI-Enabled
Education: A Foucauldian Perspective." Annals of the University of Craiova,
Psychology-Pedagogy Series, vol. 46, no. 2, pp. 162-176.
DOI: 10.52846/AUCPP.2024.2.12 · Open Access (CC-BY).`

// ==Callouts== · 10 (c-fou-1..c-fou-10)

export const callouts: Record<string, CardsCanvasItem> = {
    twabu: {
        props: {
            overline: 'scholarly anchor',
            headline: 'AUCPP 2024 · OPEN ACCESS',
            bodyText:
                'Khanyisile Twabu, "Unveiling Power Dynamics in AI-Enabled Education: A Foucauldian Perspective." Annals of the University of Craiova, Psychology-Pedagogy Series, vol. 46, no. 2 (2024), pp. 162-176. DOI: 10.52846/AUCPP.2024.2.12. Applies governmentality, biopower, disciplinary power, and the Panopticon to AI-deployment in educational systems. Stance: critical-but-engaged — calls for ethical governance, critical reflection, responsible decision-making.',
            themeColor: 'yellow',
        },
    },
    incentiveStructures: {
        props: {
            overline: 'Olah · Vatican · 25 May 2026',
            headline: 'THE STRUCTURAL ARGUMENT',
            bodyText:
                '"Every frontier AI lab — including Anthropic — operates inside a set of incentives and constraints that can sometimes conflict with doing the right thing." The need: "people outside those incentives" who are "willing to say hard things" and serve as "earnest, thoughtful critics." This page treats that argument as the apparatus-claim it is.',
            themeColor: 'pink',
        },
    },
    apparatus: {
        props: {
            overline: 'Foucault · core concept',
            headline: 'THE STRUCTURE PRODUCING SUBJECT-POSITIONS',
            bodyText:
                'Foucault’s dispositif — translated apparatus — names the heterogeneous ensemble of discourses, institutions, architectures, regulations, laws, scientific statements, philosophical propositions etc. that together produce specific subject-positions and possibilities-of-action. The frontier AI lab as apparatus produces AI engineer working inside incentive-constraints as a subject-position, not as a free actor.',
            themeColor: 'green',
        },
    },
    speakingPosition: {
        props: {
            overline: 'E. Probyn · Sexing the Self',
            headline: 'CONSTITUTIVE, NOT DISCLAIMER',
            bodyText:
                'E. Probyn’s concept (1993), carried by Stuart Hall and the post-CCCS lineage. The speaking position is not a humility-move but the substantive credential — position-shapes-what-can-be-said, and critical practice begins with recognizing-from-where-one-speaks. Outside-the-apparatus + decades-of-praxis = a real speaking-position with weight.',
            themeColor: 'yellow',
        },
    },
    biopower: {
        props: {
            overline: 'Foucault',
            headline: 'GOVERNANCE OF LIVES',
            bodyText:
                'Twabu: "the methods by which governments and institutions govern the lives and physical structures of populations." Applied to AI: algorithmic regulation of learner-experiences via observation, regulation, and moulding. The shaping happens at the level of habitus, not at the level of explicit rule.',
            themeColor: 'dim',
        },
    },
    disciplinaryPower: {
        props: {
            overline: 'Foucault',
            headline: 'STANDARDISATION + MONITORING',
            bodyText:
                'Twabu: "techniques of instruction, monitoring, and standardisation used by institutions to generate submissive and obedient individuals." Applied to AI in education: LMS analytics, proctoring AI, grading algorithms produce measured students — students whose dimensions are exactly those the apparatus can measure.',
            themeColor: 'dim',
        },
    },
    panopticon: {
        props: {
            overline: 'Bentham → Foucault',
            headline: 'SURVEILLANCE WITHOUT OBSERVER',
            bodyText:
                'Jeremy Bentham’s prison architecture: a layout enabling all prisoners to be monitored by a solitary guard without the prisoners being aware of being watched. Foucault generalizes: any structure where the possibility of being watched shapes behavior. Twabu applies it to VR environments, drone surveillance, automated proctoring — and by extension, the constant-readability of digital lives.',
            themeColor: 'dim',
        },
    },
    counting: {
        props: {
            overline: 'the apparatus AI inherited',
            headline: 'COUNTING-AS-SUCCESS',
            bodyText:
                'The academic practice — established over decades long before AI — of counting publications, citations, conference appearances as portfolio-currency. Career-shaped-by-what-can-be-counted. AI models trained on the resulting flooding-practices reproduce the apparatus that produced them. We do not need to train AI to do this; the apparatus already did the training.',
            themeColor: 'pink',
        },
    },
    professors: {
        props: {
            overline: '1996 · Diplomarbeit',
            headline: 'THE ORACLE-LIKE READING',
            bodyText:
                'Marianne Walther von Loebenstein, Hartmut Engelmann, Jürgen Münch. Witnessed Hans’s 170-page Diplomarbeit on Cultural Studies and late Foucault. Yes, go on. Devote your life to this. But spend ten years in praxis first; experience yourself performing. The advice took. Thirty years later, the speaking-position the rest of this page is offered from is what those ten years (now thirty) earned.',
            themeColor: 'yellow',
        },
    },
    expedition: {
        props: {
            overline: 'cojc · Theaterprojekt with teenagers',
            headline: 'WALKING THE TODESMÄRSCHE',
            bodyText:
                'Hans’s last large Theaterprojekt with teenagers in the German-Czech youth exchange — where he finally had the courage to walk the Todesmärsche (death-marches) routes and face what has happened in the German-Czech border-region in WWII. The biographical anchor for between hope and horror. Most of life optimistic, positive, creative — but the substrate Foucault and Bourdieu worked from is the substrate this generation now works with from the other side of the temporal arc.',
            themeColor: 'pink',
        },
    },
}

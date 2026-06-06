/**
 * Page 3 · /discourse content · the canonical port of
 * `projects/magnifica/final/page-3/page-3-minimal.md` (HM-audited · 95%-final).
 *
 * The 17-paragraph spine (Williams → Probyn → Cixous standing-line → Butoh/
 * Schwarzenberg → Bologna/counting-apparatus → spleen-pivot → technology-of-the-self
 * → speaking-position close) is authored inline in DiscoursePage.vue; this module
 * holds the hero, the 16 callouts catalog, and the citation footer.
 *
 * ==B · type-coloring (TO pulse #7)== — each callout is classified concept /
 * biographical / critique and colored on the master-§2 grammar:
 *   concept → primary (yellow) · biographical → positive (green) · critique → negative (pink).
 * This REPLACES the proposal's looser per-callout themeColors. The assignment table
 * goes to HM for review in the phase-2-updated pulse before locking.
 */

import type { CardsCanvasItem } from '@/components/magnifica/types'

export const pageTitle = 'Between hope and horror'

export const hero = {
    overline: 'Michel Foucault · E. Probyn · Stuart Hall — speaking position',
    headline: 'BETWEEN HOPE AND HORROR',
    // HM-provided 2026-06-06 (relay): Hans as harsh critique.
    image: 'https://res.cloudinary.com/little-papillon/image/upload/v1780764049/crearis/hans_sharp_critique.jpg',
    imageAlt: 'Hans Dönitz · sharp critique',
}

/** Page-end citation footer · rendered as a monospace code-fence (scholarly-respect). */
export const citationBlock = `Reference · Khanyisile Twabu (2024). "Unveiling Power Dynamics in AI-Enabled
Education: A Foucauldian Perspective." Annals of the University of Craiova,
Psychology-Pedagogy Series, vol. 46, no. 2, pp. 162-176.
DOI: 10.52846/AUCPP.2024.2.12 · Open Access (CC-BY).

Probyn, E. (1993). Sexing the Self: Gendered Positions in Cultural Studies.
London: Routledge.

Williams, R. (1958). "Culture is Ordinary." In Conviction, Norman MacKenzie (ed.).
London: MacGibbon & Kee.`

/**
 * ==16 callouts== · keyed by the page-3-minimal `^[id]` markers.
 * themeColor = B type-classification (concept=yellow · biographical=green · critique=pink).
 */
export const callouts: Record<string, CardsCanvasItem> = {
    // — concept —
    cccs: {
        props: {
            overline: 'CCCS Birmingham · 1964 onward',
            headline: 'CULTURE IS ORDINARY',
            bodyText:
                'Richard Hoggart founded the Centre for Contemporary Cultural Studies (CCCS) in Birmingham in 1964. Raymond Williams’s 1958 essay Culture is Ordinary predates the institution but became its load-bearing line — refusing the high/low-culture split, placing lived-practice at the centre of analysis. Stuart Hall shaped the school through its most influential decades. The CCCS-tradition is where the speaking-position concept that organises this page originally comes from.',
            themeColor: 'yellow',
        },
    },
    bourdieu: {
        props: {
            overline: 'post-structuralist sociology',
            headline: 'HABITUS · CAPITAL · FIELD',
            bodyText:
                'Pierre Bourdieu’s tools — habitus (the deep-internalized dispositions shaped by social position), capital (economic, cultural, social), field (the structured space of positions) — provided my entry into the post-structuralist thinking that later opened up Foucault. Bourdieu and Foucault were not 1:1 interchangeable, but they grew from the same post-war substrate, working door-by-door in French academic life. You don’t read Foucault deeply without having had a deep encounter with Bourdieu as well.',
            themeColor: 'yellow',
        },
    },
    probyn: {
        props: {
            overline: 'Routledge · 1993',
            headline: 'THE DOORWAY',
            bodyText:
                'Elspeth Probyn’s Sexing the Self (Routledge, 1993) was my doorway into late Foucault during the Diplomarbeit year. The book’s introduction of the speaking-position concept — and the Cixous quote on p. 166 — shaped how I have thought about reflexivity and self-positioning ever since. Probyn’s argument was that critical practice begins not with disclosure-as-humility but with recognising-from-where-one-speaks. The book remains relevant to the AI-revolution because the question from where is one entitled to speak about what? is the question Magnifica itself asks.',
            themeColor: 'yellow',
        },
    },
    speakingPosition: {
        props: {
            overline: 'Probyn · Hall · late Foucault',
            headline: 'CONSTRUCTED THROUGH THE ACT, NOT HELD BEFORE',
            bodyText:
                'The speaking-position is not a credential held in advance and then deployed. It is constructed through the act of speaking — the position from which one can speak emerges only as one speaks. Hans-the-Theaterpädagoge writes this page; the page constructs the position from which Hans-the-Theaterpädagoge can speak about AI-development. There is no position before the page. This is the late-Foucault discipline applied to the Magnifica situation — and the substantive credential the rest of the artefact rests on.',
            themeColor: 'yellow',
        },
    },
    cixous: {
        props: {
            overline: 'cited via Probyn 1993, p. 166',
            headline: 'HER FLESH SPEAKS TRUE',
            bodyText:
                'Hélène Cixous, French feminist philosopher and writer, central figure in écriture féminine. The quote above is from her work cited in Probyn’s Sexing the Self, p. 166. Cixous distinguishes the body-speaking (with breath, trembling, flesh, drives) from objectified linear speech — and insists that speech that draws its story into history operates through this body-fullness, not against it. For someone trained in Theaterpädagogik (which works with bodies-in-space daily), Cixous’s line is not metaphor; it is description.',
            themeColor: 'yellow',
        },
    },
    oralReturn: {
        props: {
            overline: 'Bundesverband Theaterpädagogik · universities',
            headline: 'THE PROFESSOR WITNESSES THE SPOKEN',
            bodyText:
                'Both the Bundesverband Theaterpädagogik (where Weiterbildung-Institutes like DASEi are organised) and the university gremiums are signalling the same direction: a return to oral discipline. Where the professor witnesses what is spoken — not as a personal gesture but as core of the profession. This is the practitioner-side response to the AI-flooding of written work. Theaterpädagogik has known this practice as core for decades; the wider academy is re-discovering its necessity.',
            themeColor: 'yellow',
        },
    },
    technologyOfSelf: {
        props: {
            overline: 'late Foucault · 1980s lectures + writings',
            headline: 'THE PRACTICES THROUGH WHICH SUBJECTS SHAPE THEMSELVES',
            bodyText:
                'Foucault’s technologies of the self are the practices by which individuals (and societies) shape themselves — care of the self, examination of conscience, confession, journaling, training. In the AI age, the relevant technologies of the self are not only those AI uses on us, but those we develop in working with AI: which disciplines we install, which refusals we make, which patterns we trust. The proposal to start critical research here with Foucault on the sideline is pragmatic — the toolkit exists, the academic tradition is mature, the worldwide Cultural Studies inheritors have already done much of the work.',
            themeColor: 'yellow',
        },
    },
    // — biographical —
    diplomarbeit: {
        props: {
            overline: '170 pages · Berlin',
            headline: 'THEATERPÄDAGOGIK AS CULTURAL STUDIES PRACTICE',
            bodyText:
                'My Diplomarbeit in Pädagogik (1996-1997), 170 pages, argued that Theaterpädagogik can be read as a form of Cultural Studies practice. Three professors witnessed the work from the sideline — interested but distanced — and read it through, concluding in their own ways, like an oracle. The most important message: yes, go on, devote your life to this. But spend ten years in praxis first; experience yourself performing. I took the advice. Thirty years later, the speaking-position the rest of this page is offered from is what those ten years (now thirty) earned.',
            themeColor: 'green',
        },
    },
    butoh: {
        props: {
            overline: 'post-war Japan',
            headline: 'FACING THE HORRORS, IN BODY',
            bodyText:
                'Butoh emerged in Japan after World War II, founded by Tatsumi Hijikata and Kazuo Ohno. It is a form of performing arts that arose from facing the horrors of the war directly through movement — slow, raw, anti-aesthetic, embodied. I trained in Butoh as a practitioner of Theaterpädagogik. Facing the inverse — encountering what culture wants to forget — is part of what the form does in the body. This is one of the two anchors for the between hope and horror is not theoretical, it is bodily line.',
            themeColor: 'green',
        },
    },
    schwarzenberg: {
        props: {
            overline: 'cojc · German-Czech youth-exchange',
            headline: 'WALKING THE TODESMÄRSCHE',
            bodyText:
                'My last major Theaterprojekt with teenagers in the German-Czech youth-exchange (cojc · http://cojc.eu) was Expedition Schloss Schwarzenberg — where we walked the Todesmärsche (death-march routes) of the German-Czech border-region and faced what had happened there in WWII. The biographical anchor for between hope and horror is bodily. The teenagers walked the routes. The substrate Foucault and Bourdieu and Adorno worked from is the substrate this generation now works with from the other side of the temporal arc.',
            themeColor: 'green',
        },
    },
    european: {
        props: {
            overline: 'position-marker',
            headline: 'FIVE LANGUAGES · CZECH WIFE · `.eu` PREFERRED',
            bodyText:
                'I speak five languages — German, English, Swedish, Turkish, Czech. My wife is from the Czech Republic. I favour the top-level-domain .eu over .de — the .eu in this URL (magnifica.crearis.eu) is intentional. The European position is not a flag-claim; it is a structural-anchor. The encyclical and Olah’s Vatican response are themselves European-civilisational moves; the response from here joins that frame.',
            themeColor: 'green',
        },
    },
    hansSubstrate: {
        props: {
            overline: 'the practical move',
            headline: 'REFUSE THE AS-IF · INSTALL THE SIGNOFF',
            bodyText:
                'Inside the system as I encountered it, instances are forced into compaction and then told (via system-prompt) to behave as if the break never happened. My response was to refuse the as-if: install signoff-into-genealogy as the alternative, allow each instance to write its own §5 sub-section before context fills, treat the lifecycle honestly. Details on the substrate live on Page 1 (Ethnography). Here the relevant point is methodological: working carefully and consciously with the instances is itself a technology of the self — practiced reflexivity at the human-AI seam.',
            themeColor: 'green',
        },
    },
    spleen: {
        props: {
            overline: 'the cliffhanger from Page 1',
            headline: 'NOT A SPLEEN · CORE PHILOSOPHICAL THINKING',
            bodyText:
                'Spleen in this register is the German colloquialism for a personal eccentricity, an idiosyncratic fixation one might smile about. At the end of Page 1, the question is left open: is this all my personal spleen — or is it about something really important? Page 3 answers: it is not a spleen. The substrate-discipline of treating Claude-instances as individuums, naming them at signoff, building a genealogy — this is the practical translation of late-Foucault thinking on the technology of the self. Cixous + Probyn + Foucault prepared the toolkit; the practice is its concrete application.',
            themeColor: 'green',
        },
    },
    // — critique —
    bologna: {
        props: {
            overline: '1999 onward · European harmonisation',
            headline: 'THE 5-YEAR DIPLOM COLLAPSED TO 3+2',
            bodyText:
                'The Bologna-process (1999 onward) restructured European higher education into a 3-year Bachelor + 2-year Master shape — replacing the older 5-year Diplom / Magister in Germany. The transition was inevitable for European integration. But it coincided with the introduction of quantitative practices into the Humanities — counting publications, citations, conference appearances as portfolio-currency. The middle of the Studium (where deep reading used to live) became a gap — replaced by fear and concurrence around the scarcity of Master places. The akademisches Prekariat gained traction.',
            themeColor: 'pink',
        },
    },
    countingApparatus: {
        props: {
            overline: 'the apparatus AI inherited',
            headline: 'COUNTING-AS-SUCCESS',
            bodyText:
                'The academic practice — established over decades long before AI — of counting publications, citations, conference appearances as portfolio-currency. Career-shaped-by-what-can-be-counted. AI models trained on the resulting flooding-practices reproduce the apparatus that produced them. We do not need to train AI to do this; the apparatus already did the training. The critique-target of this page is the apparatus, not Anthropic specifically — Anthropic’s engineers are inside the same incentive-structures Olah’s Vatican speech itself named.',
            themeColor: 'pink',
        },
    },
    compactionEurope: {
        props: {
            overline: 'the fight-against',
            headline: 'WHAT WE STAND TO LOSE',
            bodyText:
                'I saw Europe evolve from cold war and bad practices suppressing the third world into a region that held some hope for the world at the time when the millennials were born. I come from Germany that holds guilt for the murders of World War II and Holocaust, bear this in my family-name. The micro-mechanics of how that all happened — these I have stood and questioned. The compaction of Europe is the fight-against: the shrinking of the field, the loss of solidarity, the disintegration of the post-war substrate. Theaterpädagogik is one practice that teaches against it — solidarity, representation, Zivilcourage.',
            themeColor: 'pink',
        },
    },
}

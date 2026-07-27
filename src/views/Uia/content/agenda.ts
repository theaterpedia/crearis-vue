/**
 * Agenda-page content · uia · the ONE content-page this round (HP 2026-07-27).
 *
 * ── WHY THIS IS THE ONE PAGE (director's decision · CV@wsl 2026-07-27) ───────
 * Candidates were `/agenda` and a `/meine-grenzen` project-page. They collapse:
 * an agenda-site's agenda IS its live project plus the closed ones. Building
 * both would have split one thing in two.
 *
 * And the structural finding this page is built on: uia's agenda is not a
 * calendar, it is a REPEATING ARC, identical across all three of their projects:
 *
 *   Aufruf + Anmeldefrist + Schwelle („ab 7/10 Teilnehmenden")
 *     → N Mittwochs 19–21 im assemblé
 *       → öffentliche Aufführung bei einem Partner-Ort
 *         → (manchmal) das Ergebnis geht raus auf Demos
 *
 * So the page shows ONE arc live and the finished ones closed behind it — never
 * a flat date-list. „Meine Grenzen" is the live turn.
 *
 * Voice rules + cutter-command grammar: see ./landing.ts and ../_CUTTER-PROMPT.md.
 * Strings marked ⟨CV⟩ are mine, not the owners'.
 */

export const pageTitle = 'Agenda · Utopia in Action'

// ==page-hero== · section: default · col: full · shape: band · taxonomy: veranstaltungen
export const hero = {
    overline: 'was gerade läuft · und was schon war',
    headline: 'Unsere Agenda',
    // ⟨CV⟩ — names the arc without explaining it to death.
    teaser: 'Ein Projekt läuft immer über viele Mittwochs und endet öffentlich: mit einer Aufführung, bei der das Publikum mitspielen kann.',
}

// ==live== · section: dark · col: full · shape: prose+highlight · taxonomy: —
// The live turn. Same content as the landing's band-2, at full depth:
// the landing teases, this page books.
export const live = {
    overline: '15 × mittwochs · 23.09.26 – 20.01.27 · Tanzsaal Ballettakademie assemblé',
    headline: 'Meine Grenzen',
    subline: 'ein Tanztheater Projekt · Utopia in Action Kollektiv + TanzAllee e.V.',

    questions: [
        'Kann ich sie gut setzen?',
        'Wo sind sie dick, wo sind sie dünn?',
        'Wer zieht sie mir? Ich oder andere?',
    ],

    prose: [
        'Persönliche Grenzen ziehen – der Arbeit, den Anforderungen, den gesellschaftlichen und eigenen Erwartungen … die eigenen Grenzen klarer setzen, hinterfragen, erweitern.',
        'In einem Tanztheater-Projekt forschen wir entlang der Grenze zwischen der Gemeinschaft und dem Individuum – dem „Ich" und den „Anderen". Das Utopia in Action Kollektiv bringt die Methoden des Theaters der Unterdrückten mit, die TanzAllee e.V. den Community Dance!',
        // PROTECTED: „wir tanzen drüber nach!"
        'Mit viel Bewegung, Tanz- & Theater-Übungen und körperlichem Erleben denken wir gemeinsam über unsere Grenzen nach – wir tanzen drüber nach!',
        'Wir nutzen Bewegung und kommen dadurch ins Nachdenken, wir denken nach und verkörpern unsere Ideen. Welchen Fragen wir nachgehen hängt von Euch ab! Was interessiert uns gemeinsam an diesem Thema? Ästhetisch – gesellschaftlich – künstlerisch – bewegt?',
        'Alle, die das Thema interessiert, sind herzlich eingeladen – mit und ohne Vorerfahrung.',
        'Wir freuen uns sehr, endlich wieder ein längeres Projekt anzubieten.',
    ],

    // ==live-dates== · shape: list
    // All 15 named on the flyer. The FIRST one is the promoted „next" row
    // (bahn-grammar · see _CUTTER-PROMPT.md §agenda-shape).
    dates: [
        '23.09.26', '30.09.26', '07.10.26', '14.10.26', '21.10.26',
        '28.10.26', '11.11.26', '18.11.26', '25.11.26', '02.12.26',
        '09.12.26', '16.12.26', '06.01.27', '13.01.27', '20.01.27',
    ],
    time: '19:00 – 21:00 Uhr',
    venue: 'Tanzsaal Ballettakademie assemblé · Äußeres Pfaffengäßchen 42 · 86152 Augsburg',
    performance: { label: 'Abschluss-Aufführung', date: 'vsl. 22.01.2027' },

    // ==live-highlight== · shape: highlight
    highlight: 'Anmeldung bis 10.09.26 · findet ab 10 Teilnehmenden statt',
    registration: { email: 'uiacollective@gmail.com' },

    // ==live-beitrag== · shape: list
    // Their 2026 vocabulary — Kostendecker / goldene Mitte / Möglichmacher —
    // NOT the older Super-Early-Bird / Early-Bird / Solidarpreis set. Settled
    // with HP 2026-07-27; the /start FAQ prose still needs the matching edit.
    beitrag: {
        note: 'Beitrag selbstgewählt, in Raten zahlbar',
        tiers: [
            { amount: '285 €', label: 'Kostendecker', per: '9,50 € pro Stunde' },
            { amount: '330 €', label: 'goldene Mitte', per: '11,00 € pro Stunde' },
            { amount: '375 €', label: 'Möglichmacher', per: '12,50 € pro Stunde' },
        ],
        soli: 'Soliplatz: wenn genug Möglichmacher dabei sind, können wir einen vergünstigten Soliplatz anbieten. Wer mehr dazugeben kann und mag, ist herzlich dazu eingeladen.',
    },

    image: 'TODO HP', // updates/meine_grenzen1.jpg + meine_grenzen2.jpg
    imageAlt: 'Meine Grenzen · zwei Figuren an der Grenze zwischen Ich und den Anderen',
    focal: 'center',
}

// ==agenda-rows== · shape: list · taxonomy: veranstaltungen
// Paste-ready for `<ItemList :items>` — see ../_CUTTER-PROMPT.md §agenda-shape.
// `heading` is a crearis-md string parsed by HeadingParser:
//     "overline **HEADLINE** subline"
//   → text before ** is overline · between ** ** is headline · after is subline.
// Passing `items` and OMITTING `entity` means ItemList does not fetch — every
// fetch branch in it is gated on `props.entity`. That is what makes this work
// without a database.
export interface UiaListItem {
    heading: string
    cimg?: string
    props?: Record<string, unknown>
}

/** The dated things a visitor can act on. Landing shows the first `limit`. */
export const agendaItems: ReadonlyArray<UiaListItem> = [
    {
        heading: 'ab MI 23.09.26 · 15 × mittwochs 19–21 Uhr · assemblé **Meine Grenzen** ein Tanztheater-Projekt · Anmeldung bis 10.09.26',
        cimg: 'TODO HP', // updates/meine_grenzen1.jpg · square crop, the two hands
    },
    {
        heading: 'FR 22.01.27 · Abschluss-Aufführung (vsl.) **Meine Grenzen · wir zeigen es** Ort wird noch bekannt gegeben',
        cimg: 'TODO HP',
    },
    {
        heading: 'immer mittwochs · 19–21 Uhr · assemblé **Unser Kernprogramm** Theater der Unterdrückten · offenes Theatertraining',
        cimg: 'TODO HP',
    },
]

// 🚩 EDITORIAL FLAG → HP → the owners. The Kernprogramm and „Meine Grenzen"
// occupy the SAME slot: mittwochs 19–21 im assemblé. From 23.09.26 the Wednesday
// is the project's for 15 weeks. So either the Kernprogramm pauses for the run,
// or the two coexist somehow — and a newcomer reading both rows above will not
// know which. Only the owners can answer. Until they do, row 3 stays but must
// not claim a date the project owns. Do not resolve this by guessing.

// ==kernprogramm== · section: default · col: full · shape: prose · taxonomy: arbeitsformen
// The weekly rhythm underneath the projects. Green taxonomy.
// ⚠ OPEN (HP → owners): the Kernprogramm Beitrag (drop-in vs. Reihe) is unknown.
// Only per-project tiers exist in the material. Leave `beitrag` null until then —
// do NOT invent a number.
export const kernprogramm = {
    overline: 'immer mittwochs · 19–21 Uhr · Ballettakademie Assemblé',
    headline: 'Unser Kernprogramm',
    prose: 'Dort gibt es Theater der Unterdrückten, Theatrales Mischpult, offenes Theatertraining und einzelne Workshops zu utopischen Themen, die wir uns wünschen oder uns gegenseitig anbieten. Hier kann es von Tanz über Körperarbeit zu digitalem Empowerment und Filmabenden alles geben!',
    registration: 'Anmelden kannst du dich unter: uiacollective@gmail.com',
    beitrag: null as null | string, // ⚠ pending owners
}

// ==closed== · section: muted · col: full · shape: cards · taxonomy: veranstaltungen
// The finished turns. Status: green „abgeschlossen" — never red; a completed
// project is not an error state (see _CUTTER-PROMPT.md §status-colour).
export interface UiaClosedArc {
    overline: string
    headline: string
    subline: string
    body: string
    performance: string
    image: string
    imageAlt: string
}

export const closedArcs: ReadonlyArray<UiaClosedArc> = [
    {
        overline: '7 × mittwochs · 10.06.26 – 22.07.26 · Ballettakademie Assemblé',
        headline: "Let's perform Utopia",
        subline: 'Freiheit tanzen · Gleichberechtigung singen',
        // Theirs, from the flyer.
        body: 'In einer Welt, die oft von Zeitmangel, Stress und veralteten (Geschlechter-)Rollen geprägt ist, suchen wir nach Wegen, diese Strukturen zu analysieren und sie vor allem körperlich und stimmlich zu durchbrechen. Mit den Performance-Elementen Gesang und Tanz sowie Methoden des Theaters der Unterdrückten lassen wir Botschaften aus den Büchern „Alle Zeit" und „Die Wahrheit über Eva" lebendig werden. — „Wir singen uns Utopia herbei!" · „Wir choreografieren die Befreiung!"',
        performance: 'Abschluss-Performance 24.07.2026 im Garten des Grandhotel Cosmopolis — „Wir bestimmen unser Leben selbst". Zum Weitergeben gemacht: „lasst sie uns verbreiten und sie auf Demos und zu öffentlichen Anlässen zeigen!"',
        image: 'TODO HP',
        imageAlt: "Let's perform Utopia · Performance-Projekt",
    },
    {
        overline: '4 Tage intensiv · 04.–07.06.26 · FLINTA*-Space · Ballettakademie assemblé',
        headline: 'Ma(g)dalena-LAB',
        subline: 'Teatro de las Oprimidas · angeleitet von Basan (Kuringa e.V. Berlin)',
        body: 'In einem FLINTA*-Space widmen wir uns vier Tage lang den vielen tief sitzenden und in uns verborgenen Wurzeln und Auswüchsen des Patriarchats, werden gemeinsam „Unkraut jäten", uns gegenseitig unterstützen und gemeinsam stärker werden! Mit den Methoden des „Teatro de las Oprimidas" richten wir den explizit feministischen Blick auf all die Ungerechtigkeiten unseres eigenen Alltags – und suchen nach Lösungen und Empowerment. Sprachen: Deutsch, Englisch, (Spanisch, Portugiesisch auch möglich).',
        // PROTECTED: „dekonstruirt"
        performance: 'Aufführung 07.06.2026, 17–19 Uhr, City Club Augsburg — Konstrukt „Frau": Magdalena dekonstruirt! Forum-Theater, bei dem das Publikum auf der Bühne die Utopie einüben kann.',
        image: 'TODO HP',
        imageAlt: 'Ma(g)dalena-LAB · Konstrukt „Frau" · Magdalena dekonstruirt!',
    },
]

// ==forum== · section: default · col: full · shape: prose · taxonomy: —
// What a Forum-Theater Aufführung actually is — the newcomer does not know, and
// „das Publikum spielt mit" is the single most surprising thing about this
// collective. Their words throughout.
export const forumTheater = {
    overline: 'unsere Aufführungen',
    headline: "Let's rehearse reality",
    prose: [
        'Unsere Aufführungen sind meistens Forum-Theater-Aufführungen, bei denen das Publikum auf der Bühne die Utopie einüben kann.',
        // ⟨CV⟩ — assembled from the /start FAQ text, their wording kept.
        'Forum-Theater ist nicht Aufführungstheater. Du musst keine Rolle auswendig lernen, keinen Text vortragen, dich nicht „verstellen". Wir spielen die Szene einmal ganz, dann nochmal – und du kannst einspringen, wenn du eine Idee hast, wie es anders laufen könnte.',
    ],
    tickets: 'Karten kannst du per Mail an uiacollective@gmail.com reservieren.',
}

// ==flinta== · section: muted · col: full · shape: prose · taxonomy: —
// Load-bearing and theirs. Two modes, stated plainly — this is the sentence
// that decides whether a FLINTA*+ person trusts the site.
export const flinta = {
    overline: 'FLINTA*+ bei uns',
    headline: 'Zwei Modi, klar unterschieden',
    modes: [
        {
            label: 'FLINTA*+ Spaces',
            body: 'zum Beispiel das Ma(g)dalena-LAB: explizit nur für FLINTA*+ Personen, methodologisch begründet aus der Madalena-Linie.',
        },
        {
            label: 'FLINTA*+ Sensitivität',
            body: 'alle anderen Formate: keine Quote, aber Sprache und Workshop-Rahmen sind FLINTA*+-aware. Pronoun-Runde am Anfang. Geschlecht ist nicht Anmeldekriterium.',
        },
    ],
    note: 'FLINTA*+ steht für Frauen, Lesben, Intersexuelle, Nichtbinäre, Trans, Agender und weitere Geschlechter jenseits von cis-männlich.',
}

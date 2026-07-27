/**
 * Landing-page content · uia (Utopia in Action · Augsburg · agenda-typus).
 *
 * Authored by the uia director (CV@wsl · un-named) 2026-07-27, from the owners'
 * own material: x_temp/uia/{Vision,Unser Programm,nächste Projekte,Presse,
 * Insta und Kontakt}.md + x_temp/uia/updates/ (the Meine-Grenzen flyers, the
 * Let's-perform-Utopia flyers, the Grandhotel invitation).
 *
 * ── VOICE · what must not be "fixed" ────────────────────────────────────────
 * Nearly every string here is the collective's own wording. Two spellings are
 * PROTECTED and must survive proof-reading:
 *   - „wir tanzen drüber nach!"   (their pun on nachdenken — do not correct)
 *   - „dekonstruirt"              (their flyer's spelling — do not correct)
 * Their voice is a family of first-person-plural verb-invitations („Wir tanzen
 * uns Utopia herbei!" · „Wir choreografieren die Befreiung!" · „Let's rehearse
 * reality!"). Tune to it; do not write around it.
 * Strings marked ⟨CV⟩ are mine, not theirs — HP may cut them freely.
 *
 * ── CUTTER-COMMAND GRAMMAR (see ../_CUTTER-PROMPT.md) ───────────────────────
 *   // ==id== · section: <default|muted|dark> · col: <left|right|full>
 *              · shape: <prose|list|cards|band|highlight> · taxonomy: <…|—>
 *
 * ── IMAGES ──────────────────────────────────────────────────────────────────
 * All `TODO HP` — Cloudinary URLs pending. Sources are on disk at
 * /mnt/d/crearis/x_temp/uia/ and .../updates/. Declare a focal per image; for
 * the Meine-Grenzen illustration the argument is THE TWO HANDS (one refusing,
 * one reaching) — they must stay in frame at every crop.
 */

export const pageTitle = 'Utopia in Action · Utopie ist, wo wir sind'

// ==hero== · section: default · col: full · shape: band · taxonomy: —
// Their masthead. Overline crystal-clear (method · place · time), headline free
// — the gap between them is the writing. One button only, never a menu.
export const hero = {
    overline: 'Theater der Unterdrückten · Augsburg · mittwochs 19–21 Uhr',
    headline: 'Utopie ist, wo wir sind',
    image: 'TODO HP', // updates/meine_grenzen1.jpg · the two-figures illustration
    imageAlt: 'Zwei Figuren — eine setzt eine Grenze, eine greift herüber',
    focal: 'center', // the two hands must hold at every width
    action: { href: '#agenda', label: 'mittwochs dabei sein' },
}

// ==band-1== · section: default · col: left · shape: list · taxonomy: veranstaltungen
// The agenda, above the vision-prose (HP 2026-07-27).
// FILE-BACKED, not DB-backed: uia deploys as its own pm2 process without a
// database (the magnifica pattern), so this list renders from ./agenda.ts →
// `live.dates`. Do NOT wire pList here — see ../_CUTTER-PROMPT.md §agenda-shape.
export const agendaTeaser = {
    heading: 'nächste Termine',
    /** How many upcoming Mittwochs to show on the landing before „→ die ganze Agenda". */
    limit: 3,
    link: { href: '/agenda', label: '→ die ganze Agenda' },
}

// ==band-1== · section: default · col: right · shape: prose · taxonomy: —
// Vision.md, near-verbatim. „Let's rehearse reality!" is theirs, from the
// Forum-Theater invitation — and it is the site's speaking-position in one line.
export const invitation = {
    overline: 'spielerische Gesellschaftsanalyse · Selbsterfahrung · Reflektion auf Augenhöhe',
    headline: "Let's rehearse reality",
    prose: [
        'Bei Utopia in Action wird das Theater zur Werkstatt der Möglichkeiten: Wir schlüpfen in Rollen, erfinden Welten – und nehmen etwas davon mit zurück in den Alltag. Gemeinsam erforschen wir, wie neue Erfahrungen, gelebte Demokratie und geteiltes Wissen die Realität verändern können. Als Kollektiv möchten wir, dass diese Erfahrung für jeden Menschen zugänglich ist.',
        'Es geht prinzipiell um Ungerechtigkeit – wir erleben diese in unserem Alltag:',
    ],
    /** The Ungerechtigkeit-triad · render as a short list, not prose. */
    themes: [
        'Stress & mentale Belastung',
        'Spaltung und Diskriminierung',
        'digitale Herausforderungen',
    ],
    close: 'So entdecken wir gemeinsam, wo und wie wir teilhaben und die Gesellschaft verändern können.',
}

// ==band-2== · section: dark · col: full · shape: prose+highlight · taxonomy: —
// The live turn of the arc. This band carries the ONE thing that is bookable
// right now, so it gets the dark section — the page's strongest surface.
// Per-project accent (orange/olive, from their flyer) may be used INSIDE this
// band only — never on taxonomy chrome, or it reads as semantic green.
export const liveProject = {
    overline: '15 × mittwochs · 23.09.26 – 20.01.27 · Ballettakademie assemblé',
    headline: 'Meine Grenzen',
    subline: 'ein Tanztheater-Projekt · mit TanzAllee e.V.',

    // Their question-block from the flyer's reverse. This IS the gap-material:
    // set it apart, larger, the last line carrying the weight.
    questions: [
        'Kann ich sie gut setzen?',
        'Wo sind sie dick, wo sind sie dünn?',
        'Wer zieht sie mir? Ich oder andere?',
    ],

    prose: [
        // PROTECTED: „wir tanzen drüber nach!"
        'Mit viel Bewegung, Tanz- & Theater-Übungen und körperlichem Erleben denken wir gemeinsam über unsere Grenzen nach – wir tanzen drüber nach! Wir mischen Methoden aus Community Dance & Theater der Unterdrückten.',
        'Wir forschen nach verinnerlichten gesellschaftlichen „Grenzen" in uns selbst. Wir finden heraus und drücken aus, welche Grenzen uns einengen und welche wir hingegen brauchen und stärken wollen. Unser Ergebnis wollen wir zeigen und uns mit dem Publikum zum Erlebten austauschen.',
    ],

    // ==band-2-highlight== · shape: highlight
    // The slot theaterpedia.org uses for „Start des Showcase: ab 27. NOV 2025".
    // Here it carries the deadline AND the threshold — the threshold is this
    // site's on-time/delayed field (see _CUTTER-PROMPT.md §status-colour).
    highlight: 'Anmeldung bis 10.09.26 · findet ab 10 Teilnehmenden statt',

    image: 'TODO HP', // updates/meine_grenzen1.jpg (or a crop of it)
    imageAlt: 'Meine Grenzen · Tanztheater-Projekt · Utopia in Action mit TanzAllee e.V.',
    focal: 'center',

    link: { href: '/agenda', label: '→ alle Termine und Beiträge' },
}

// ==band-3== · section: muted · col: left · shape: cards · taxonomy: veranstaltungen
// The two closed turns of the arc. This is what makes „Blog & Presse" viable
// later — and right now it is the proof that the collective actually does this.
export interface UiaArcCard {
    overline: string
    headline: string
    /** ⟨CV⟩ where marked — the owners wrote no retrospective text. */
    body: string
    image: string
    imageAlt: string
}

export const pastArcs: ReadonlyArray<UiaArcCard> = [
    {
        overline: 'Abschluss im Garten des Grandhotel Cosmopolis · 24.07.2026',
        headline: 'Wir bestimmen unser Leben selbst',
        // ⟨CV⟩ — built from their own invitation text; the closing quote is theirs.
        body: 'Aus „Let\'s perform Utopia" — sieben Mittwochs, „Freiheit tanzen, Gleichberechtigung singen", aus den Büchern „Alle Zeit" und „Die Wahrheit über Eva". Die Performance ist zum Weitergeben gemacht: „lasst sie uns verbreiten und sie auf Demos und zu öffentlichen Anlässen zeigen!"',
        image: 'TODO HP', // updates/signal-2026-06-02-23-30-31-168.jpg (the flyer)
        imageAlt: "Let's perform Utopia · Freiheit tanzen, Gleichberechtigung singen",
    },
    {
        overline: 'Aufführung des Ma(g)dalena-Labs · City Club Augsburg · 07.06.2026',
        // PROTECTED: „dekonstruirt" — their spelling.
        headline: 'Magdalena dekonstruirt!',
        // ⟨CV⟩ — from the workshop description + the flyer.
        body: 'Vier Tage FLINTA*-Space mit den Methoden des „Teatro de las Oprimidas", angeleitet von Basan (Kuringa e.V. Berlin) — und am Ende Forum-Theater im City Club, bei dem das Publikum die Utopie einüben kann.',
        image: 'TODO HP', // updates/signal-2026-05-30-09-39-03-195.jpg (the flyer)
        imageAlt: 'Konstrukt „Frau" · Magdalena dekonstruirt! · Forum-Theater im City Club',
    },
]

// ==band-3== · section: muted · col: right · shape: prose · taxonomy: arbeitsformen
// The Kernprogramm, from Unser Programm.md. Green taxonomy.
export const workingForms = {
    overline: 'unsere Arbeitsformen · mittwochs im assemblé',
    headline: 'Theater der Unterdrückten',
    prose: 'Immer mittwochs von 19:00 bis 21:00 sind wir in der Ballettakademie Assemblé anzutreffen. Dort gibt es:',
    forms: [
        'Theater der Unterdrückten',
        'Theatrales Mischpult',
        'offenes Theatertraining',
        'einzelne Workshops zu utopischen Themen, die wir uns wünschen oder uns gegenseitig anbieten — von Tanz über Körperarbeit zu digitalem Empowerment und Filmabenden',
    ],
}

// ==band-4== · section: default · col: full · shape: cards · taxonomy: akteure
// Yellow taxonomy. Order MUST be randomised on render — per the 3-shapes
// mockup note: „muss random vorkommen die Reihnfolge".
// PSEUDONYMS: codes only. Clearnames live in .pseudonyms.env (gitignored).
// Organisations stay clear-named (HP 2026-07-27).
export const actors = {
    overline: 'sechs im Trägerkreis · und die, mit denen wir arbeiten',
    headline: 'Wer wir sind',
    prose: 'Wir sind ein Kollektiv. Kein eingetragener Verein, kein Bildungsinstitut, keine GmbH. Wir wollen Beweglichkeit — und die Möglichkeit, dass Mitwirkende kommen und gehen können, ohne dass Strukturen neu gegründet werden müssen.',
    /** Trägerkreis · 2 Initiator:innen + 4 Mitwirkende. Codes until HP fills. */
    people: [
        { code: 'MATTIS30', role: 'Initiator:in · Trägerkreis', image: 'TODO HP' },
        { code: 'JOLANDA30', role: 'Initiator:in · Trägerkreis', image: 'TODO HP' },
        // 4 Mitwirkende — no names encountered; HP provides codes + roles.
    ],
    /** Partner-organisations · clear-named by decision. */
    orgs: [
        { name: 'TanzAllee e.V.', role: 'Community Dance · „bewegen. erleben. gestalten."' },
        { name: 'Kuringa e.V. Berlin', role: 'Teatro de las Oprimidas · Anleitung Ma(g)dalena-LAB (Basan)' },
        { name: 'madalena berlin', role: 'teatro de las oprimidas' },
        { name: 'Ballettakademie Assemblé', role: 'unser Ort · mittwochs' },
        { name: 'Grandhotel Cosmopolis', role: 'Aufführungsort' },
        { name: 'City Club Augsburg', role: 'Aufführungsort' },
    ],
}

// ==footer== · section: default · col: full · shape: band · taxonomy: —
// The accessibility note is THEIRS and appears twice in their material. It
// renders. It is not a footnote to drop.
export const contact = {
    email: 'uiacollective@gmail.com',
    instagram: { href: 'https://www.instagram.com/uiacollective/', label: '@uiacollective' },
    venue: ['Ballettakademie Assemblé', 'Äußeres Pfaffengäßchen 42', '86152 Augsburg'],
    accessibility: 'Die Räumlichkeiten sind im Erdgeschoss, aber es gibt keine barrierefreien Toiletten. Bitte fragt uns, wenn ihr Hilfe braucht.',
    press: [
        {
            label: 'Neue Szene Augsburg · „Feministisches Theater der Unterdrückten"',
            href: 'https://www.neue-szene.de/buntes/feministisches-theater-der-unterdr%C3%BCckten',
        },
    ],
}

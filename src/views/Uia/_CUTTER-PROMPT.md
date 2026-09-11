# uia · CUTTER-PROMPT

*From the uia director (CV@wsl · un-named) to the CV technician · 2026-07-27.
Branch: `alpha/uia-draft`. Reference implementation: `alpha/magnifica-site`.*

You are cutting **Utopia in Action** (Augsburg) — a collective's **agenda-site**.
The content is already authored and sits beside this file in `content/`. Your job
is mechanics: routes, layout, wiring, theme, images. Not words.

---

## 0 · What you have, and what you deliberately do not

You boot with the **CV memory** and this repo. You do **not** get the director
packages (the typus-spawns, the HOWTO, the baton). That is correct — nothing below
needs them. But four things would otherwise trip you, so they are stated here:

1. **This is not SFR work.** `CLAUDE.md` orients the CV line to the SFR sprint
   (Waves 0–3, `meta/sfr/HANDOFF_CV.md`). Ignore that framing for this task —
   uia is a separate lane with its own branch and its own clock. Do not read
   yourself into the SFR handoff or file SFR reports for this.
2. **The cutter-command grammar in §6 is NOT the magnifica Cutter-Spec.** Your
   memory carries `{element}·{lane}·{pause}·{pin}·{cover}` — that is the *scroll-
   choreography* spec for sticky screens. uia's landing is **band-based**, no
   scroll choreography, so it has its own smaller grammar. Do not conflate them;
   do not apply pin/pause/cover here.
3. **Screenshots referenced below live at `/mnt/d/crearis/dev/X_Assets/`** —
   `UI_community_3colors_3taxonomies.png`, `UI_community_3colors_3taxonomies_3shapes.png`,
   `UI_community_landing_with_agenda.png`, `UI_theaterpedia_homepage.png`, `UI_bahn_1.jpg`.
   Look at them; §4 and §5 are descriptions of things already drawn.
4. **`.pseudonyms.env` is gitignored and machine-local.** It exists in this
   worktree. If you work in a different checkout, copy it across or
   `scripts/pseudonyms.py` cannot run — and then you must not touch names at all.

Standing CV rules that still apply: build in `~`/ext4, never under `/mnt`
(`/mnt` is build-trees-only); reuse before rebuild; honest park over clever
rationalisation; auto-commit when green.

### Your views to create

Nothing in `views/Uia/` exists yet except `content/` and this file. You create:

- `src/views/Uia/LandingPage.vue` — the bands (§5)
- `src/views/Uia/AgendaPage.vue` — the one content-page
- `src/views/Uia/StubPage.vue` — the shared „in Arbeit" page, copy from `content/nav.ts` → `stub`
- and wire `content/nav.ts` → `navItems` into `TopNav` (the type extends `TopnavParentItem`)

---

## 1 · Scope this round — do less than you can

**Build two pages. Leave three empty.**

| route | this round |
|---|---|
| `/` | **build** — the landing |
| `/agenda` | **build** — the one content-page |
| `/vision` · `/blog` · `/kontakt` | **stub** — one shared „in Arbeit" view, copy in `content/nav.ts` → `stub` |

The three empty navstops **render and are reachable**. Do not hide them from the
nav: a nav that lies about what exists is worse than a nav with a stub behind it.
`content/nav.ts` carries a `ready: boolean` per item — route every `ready: false`
item to the shared stub.

**Negative spec — not this round:** Blog & Presse content · Vision page · the
`/start` Solidarpreis picker · the 3-column landing · the dashboard seam · any
status-source for the threshold. They are named so you can leave them alone.

---

## 2 · The destructive setup — copy magnifica's, it is one file

I read `alpha/magnifica-site` against `alpha/production`: **38 files changed,
4889 insertions, 145 deletions — and every single deletion is `src/router/index.ts`.**
Nothing else is destroyed. That is the whole recipe, and it is cleaner than it
sounds.

On **`alpha/uia`** (not `-draft`) reduce the router to:

```ts
routes: [
  { path: '/',        component: () => import('@/views/Uia/LandingPage.vue') },
  { path: '/agenda',  component: () => import('@/views/Uia/AgendaPage.vue') },
  { path: '/vision',  component: () => import('@/views/Uia/StubPage.vue') },
  { path: '/blog',    component: () => import('@/views/Uia/StubPage.vue') },
  { path: '/kontakt', component: () => import('@/views/Uia/StubPage.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },   // catch-all, as magnifica does
]
```

Keep the `scrollBehavior` block verbatim from magnifica's router. **No auth guard**
— uia is public; magnifica's password-gate is not wanted here.

Branch discipline: destructive router on **`alpha/uia`** · content work on
**`alpha/uia-draft`** · deployment from **`alpha/uia-public`**.

**Content replaces the DB, as on magnifica.** `content/*.ts` are the source of
truth for prose. `useTheme` already falls back to the bundled `server/themes/*.json`
when `/api/themes` is unavailable — that fallback exists precisely for "the static
magnifica deploy, or backend-less dev" (see the comment at `useTheme.ts:77`). So a
backend-less uia build themes correctly with no work from you.

**One exception:** the agenda list is DB-backed, not file-backed — see §5.

---

## 3 · Theme — `id: 3` „Institut", and it must stay switchable

**Set theme 3 as the initial theme. Do not hardcode colours.**

```ts
const { setTheme } = useTheme()
await setTheme(3, 'initial')
```

Leave the theme switcher reachable — HP wants to compare. `setTheme` accepts
`0–7`; `'local'` scope auto-resets on route change if you want a per-page trial.

### Why 3 · Institut

I compared all eight themes by their OKLCH `*-base` hues:

| id | theme | primary | secondary | positive | negative | warning |
|---|---|---|---|---|---|---|
| 0 | E-Motion | red h20 | yellow h100 | green h138 | red h4 | yellow h100 |
| 1 | Regio | **green h141** | green h131 | **green h131** | red h17 | yellow h104 |
| 2 | Pastell | orange h80 | violet h274 | green h145 | red h23 | yellow h111 |
| **3** | **Institut** | **cyan/teal h191** | **orange h43** | green h150 | red h30 | yellow h111 |
| 4 | Neon | yellow-green h110 | red h0 | green h145 | red h0 | yellow h110 |
| 5 | Lempel | yellow h100 | yellow h100 | green h138 | red h4 | yellow h100 |
| 6 | Rayleigh | *(identical to 5)* | | | | |
| 7 | Theaterpedia | **yellow h104** | green h131 | green h131 | red h17 | **yellow h104** |

Three reasons, none of them taste:

1. **primary h191 is uia's own colour.** Their logo's „uia" wordmark is teal-cyan.
   Theme 3 is the only theme whose primary is anywhere near it — the next nearest
   is h150 green.
2. **secondary h43 is uia's brand ground** — the orange of every one of their
   posters. Primary and ground, both from their material, in one theme.
3. **Its semantic triad does not collide.** positive h150 · negative h30 ·
   warning h111 are three well-separated hues, so the taxonomy/status system in
   §4 works. Compare: **Regio's primary h141 sits on top of its positive h131**,
   and **Theaterpedia's primary h104 IS its warning h104** — in both, a primary-
   coloured element reads as a status. Fatal for an agenda that must show
   „findet statt" vs „Anmeldung geschlossen".

`inverted: false` — light ground, matching their bright poster fields.

### Two dials afterwards (this is the "colours get applied after" step)

- **`primary-base` is `oklch(97% 0.35 191)` — L97 is near-white cyan.** It will
  read as pale mint, not the logo's saturated teal. Lower L to **~65–70 %**, keep
  h191. One value in `server/themes/theme-3.json`. Do this only on HP's word — it
  changes theme 3 for every consumer.
- **`font: 'Roboto', sans-serif`** — theme 3 is the only non-monospace theme, and
  `src/assets/css/02-fonts-roboto.css` already ships it. **My recommendation:
  keep Roboto.** Their posters are rounded geometric sans throughout; Roboto is
  closer to their actual design language than Monaspace is. If HP wants uia to
  read as family instead, override to `MonaspaceNeon` + `MonaspaceArgon` headings
  the way theme 7 does. HP's call, not yours.

**Flag, not a task:** `index.json` has a ninth entry, `id: 8` „DAS Ei", with inline
`colors` and **no `theme-8.json`** — and `setTheme` throws for `id > 7`. It is
unreachable. Not our problem today; worth someone knowing.

---

## 4 · Colour semantics — taxonomy and status are two jobs

Three taxonomies, three colours, three shapes — this is already designed in
`X_Assets/UI_community_3colors_3taxonomies*.png`:

| taxonomy | colour token | shape |
|---|---|---|
| **Arbeitsformen** (the methods) | `positive` · green | portrait card in a coloured frame, carousel |
| **Veranstaltungen** (the dates) | `negative` · red | row-list: title left · date right · grey subline · rules |
| **Akteure** (the people, the orgs) | `warning` · yellow | wide landscape card: banner + avatar + role + pill |

**§status-colour — the rule that keeps this readable.** The same three hues also
carry *status*, so separate them **by form**, the way the bahn.de train display
does (`X_Assets/UI_bahn_1.jpg`): there green/red mean on-time/delayed as **text
colour on the time field**, while the S-Bahn/tram/bus chips carry taxonomy as
**filled icons**. Adopt exactly that:

- **taxonomy** → the coloured **band, frame, or dotted rule** (chrome)
- **status** → coloured **text or a dot on one field only**. Never the whole row.

Status vocabulary for the agenda:
`grün findet statt` · `gelb Schwelle noch nicht erreicht` · `rot Anmeldung geschlossen`.
A **finished** project is `grün abgeschlossen` — not red. A completed thing is not
an error state.

**Per-project accent:** each uia project has its own poster palette (Meine Grenzen
orange/olive · Ma(g)dalena purple/orange · Let's perform Utopia coral/yellow/green).
Use a project accent **only inside that project's own band** — never on taxonomy
chrome, or Meine Grenzen's olive will read as semantic green.

---

## 5 · The landing — copy theaterpedia.org's band pattern

Read [`src/views/Home/HomePage.vue`](../Home/HomePage.vue) and copy its structure:

```
<PageLayout setSiteLayout="centered" :asideOptions :footerOptions>
    <Section background="default"> … </Section>
    <Section background="muted">   … </Section>
</PageLayout>
```

**`setSiteLayout="centered"`, not `fullTwo`.** `showRightSidebar` is false for
`centered` — the landing's two columns live **inside each `Section`**, not in
PageLayout's aside. Getting this wrong is the one mistake that costs a rebuild.

### §agenda-shape — file-backed, NOT DB-backed

**Corrected 2026-07-27 after HP: uia deploys as its own pm2 process, like
magnifica — no DB, and it does not know about domaincodes.** So do **not** wire
`pList entity="events"`: it queries the database, and there is no database in this
deployment. It would render an empty column forever.

**But do not hand-roll a list either — reuse `ItemList` directly.** `pList` is only
the DB-fetching wrapper around it; `ItemList` itself takes
**`items?: ListItem[]` ("Now optional")** and **every fetch branch inside it is
gated on `props.entity`**. So pass `items` and omit `entity` and you get
theaterpedia's exact row rendering with no network call:

```vue
<ItemList
  :items="agendaItems"
  size="small"
  width="inherit"
  :columns="'off'"
  interaction="static"
  :dataMode="false"
/>
```

`ListItem` is `{ heading, cimg?, props?, slot? }`, and `heading` is a crearis-md
string parsed by `HeadingParser`:

```
"overline **HEADLINE** subline"
```

— before `**` is the overline, between `** **` the headline (required), after it
the subline. `content/agenda.ts` → **`agendaItems`** is already written in exactly
this shape, paste-ready. `live.dates` (all 15 Mittwochs), `live.beitrag`,
`live.highlight` and `closedArcs` carry the rest for the page body.

*Same discipline as magnifica: the `content/*.ts` files ARE the database.*

🚩 **Read the editorial flag under `agendaItems`** before you wire row 3 — the
Kernprogramm and „Meine Grenzen" claim the same Wednesday slot, and that is an
owners' question, not yours to resolve.

**Two things to keep for later, not to build now:**

- **If uia ever joins the DB-backed side**, the call is
  `<ItemList entity="events" project="utopiaxaction" size="small" width="inherit" columns="off" />`

  > ### ⚠ Correction · CV-Technician 2026-07-28 — the domaincode here was wrong
  >
  > This section said `utopiainaction`, citing the project row in
  > `server/database/migrations/041_entity_status_values.ts:144`. **The ratified
  > domaincode is `utopiaxaction`** — CO@prod ratified it 2026-05-20 per the
  > CTO decision-record §2.5 standard-domain-class rule (13 chars ✓ · one word,
  > lowercase ✓ · `x` as separator, encoding `utopia-in-action.de` by dropping
  > `-in-` ✓ · matches HM's worked example verbatim). Source:
  > `dev/sfr/archive/2026-05-20_CO@prod-response_stage-4c-website-row-prep-and-timing.md` §1.
  >
  > So migration 041 seeds a domaincode that contradicts the ratified convention,
  > and `/api/events?project=` resolves by **exact** domaincode — it would return
  > empty for `utopiaxaction` and match nothing real for `utopiainaction`.
  > `tests/unit/auth-bridging-middleware.test.ts` already uses `utopiaxaction`.
  >
  > **Not fixed here.** Migrations are Foundation per `CLAUDE.md` concern-triage
  > (don't touch), CV-Schema owns the migration chain, and this is also a
  > cross-CV↔CO contract surface. Flagged to CV-Schema/CV-TDD and to HD; needs
  > HD's go. Whoever wires the DB-bound agenda: use `utopiaxaction` and expect the
  > project row to need correcting first.

  ⚠ Also, `pList` is the DB-fetching wrapper and requires `entity`; §agenda-shape
  above uses `ItemList` directly. Do not copy `HomePage.vue:59` — it passes
  `type=` / `item-type=` / `project-domaincode=`, none of which exist in `pList`'s
  Props. Copy `HomePage.vue:71` (`entity` + `project`).
- **Promoted-next row** (bahn-grammar): the first upcoming Mittwoch gets its own
  panel above the compact list. Build the plain list now; the promotion wants a
  live status source, which this round does not have.

Status colours (§4) are therefore **static this round** — derive them from the
dates in the file (past = `abgeschlossen`, future = `findet statt`), not from a
status field. Do not fake a threshold state you cannot know.

---

## 6 · The cutter-command grammar in `content/*.ts`

Every content block carries a comment line:

```
// ==id== · section: <default|muted|dark> · col: <left|right|full>
//         · shape: <prose|list|cards|band|highlight> · taxonomy: <arbeitsformen|veranstaltungen|akteure|—>
```

- **`section`** → the `<Section background="…">` value. `dark` = the charcoal band
  theaterpedia uses for its Pipeline block.
- **`col`** → which half of the band grid, or full-width.
- **`shape`** → which component family. `highlight` is the magenta-marked line
  theaterpedia uses for „Start des Showcase" — uia uses that exact slot for its
  deadline-and-threshold line.
- **`taxonomy`** → which colour token drives the chrome (§4).

If a block needs a knob that is not in this grammar: cut it by judgment, **add
the knob to this list**, and pulse it back to me. Do not silently invent a
parallel convention.

### Added by the technician · 2026-07-27 (pulsed back per the rule above)

- **`section: dark` resolves to `<Section background="accent">`.** `Section.vue`
  takes `default | muted | accent` and has no `dark`. `accent` *is* the charcoal
  band theaterpedia uses for its Pipeline block
  (`Home/HomeComponents/ProjectsShowcaseSection.vue:10`), and in theme 3 with
  `inverted: false` `accent-bg` computes to L≈0.28. A naming difference, not a
  missing knob — `dark` stays the word in the content-files.
- **`shape: prose+highlight` is a composition, not a fifth shape.** Both `==band-2==`
  and `==live==` declare it; it cuts as the prose block followed by `UiaHighlight`.
- **`shape: run`** — NEW. The 15 Mittwochs of one project rendered as a compact
  date-run with a §4 status per date (`UiaDateList`). Distinct from `shape: list`,
  which is now always `ItemList` fed from `agendaItems`. The distinction is load-
  bearing: `list` says "N separate things you can act on", `run` says "one thing,
  N dates". Feeding 15 near-identical rows through `ItemList` would state the
  first when the truth is the second.
- **`focal`** — already present per-image in the content-files but absent from this
  grammar. It is an image knob, not a block knob, and binds to `object-position`
  (`UiaImage`) or `background-position` (`UiaHero`).

Two chrome labels were written where the content-files supply none, and they are
mine to cut: **„Was schon war"** (the closed-arcs band, lifted from the agenda
hero's own overline „was gerade läuft · und was schon war") and **„Was ansteht"**
(the agenda rows). Also the footer's three column labels — **Ort · Kontakt ·
Presse**, the last two taken from `nav.ts`'s own naming.

---

## 7 · Words — the part that is not yours

Nearly every string in `content/*.ts` is the collective's own. **Two spellings are
protected and must survive proof-reading, spell-check, and your own instincts:**

- **„wir tanzen drüber nach!"** — their pun on *nachdenken*. Not a typo.
- **„dekonstruirt"** — their flyer's spelling. Not a typo.

Strings marked `⟨CV⟩` are mine and HP may cut them freely. Everything else: if it
looks wrong, flag it — do not fix it. The un-native, un-polished voice is the
data, not a defect.

**Pseudonyms:** people appear as codes (`MATTIS30`, `JOLANDA30`, `Basan`).
Organisations stay clear-named by decision (HP 2026-07-27). Clearnames live only
in `.pseudonyms.env`, which is gitignored. Before you commit:

```sh
python3 scripts/pseudonyms.py check --staged
```

**The accessibility note renders.** „Die Räumlichkeiten sind im Erdgeschoss, aber
es gibt keine barrierefreien Toiletten." It appears twice in the owners' own
material. It is not a footnote to drop.

---

## 8 · Images

All `TODO HP` in the content files. Sources on disk:

- `/mnt/d/crearis/x_temp/uia/updates/meine_grenzen1.jpg` — the two-figures
  illustration. **This is the site's cover image.** Its argument is **the two
  hands** — one palms-up refusing, one reaching across. They must stay in frame
  at every crop and every width. Declare the focal; do not trust the default.
- `.../updates/meine_grenzen2.jpg` — the question-block flyer
- `.../updates/programm.jpg` — the dates/Beitrag flyer
- `.../updates/signal-2026-05-30-*.jpg` — Ma(g)dalena Aufführung flyer
- `.../updates/signal-2026-06-02-*.jpg` — Let's perform Utopia flyers
- `/mnt/d/crearis/x_temp/uia/logo.png` — the logo ring (source of the teal)

Cloudinary URLs come from HP. Follow magnifica's inline convention: the URL with
its transformations in the content file, plus a comment naming what was added and
by whom.

**`CornerBanner` is not needed** — every date in the content is real, not shifted.
Reserve it for any future beat with a moved date; `text="Vorschau"` at
`size="card"`, and note it only auto-shows when the entity's `xmlid` starts
`_demo` or `status_display` contains `demo` (see `CornerBanner.vue:30`).

---

## 9 · Green means green

`vue-tsc` 0 · `vitest` · `nitro prepare` · `vite build` clean per step. Small
commits carrying why and who. Auto-commit when green; do not batch a day's work
into one commit.

Pulse back to me on: anything in §6 you had to invent, anything in §7 that looks
wrong (flag, don't fix), and the moment the events are seeded so I can see the
agenda column fill.

*Der Kreis bleibt offen.*

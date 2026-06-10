# Magnifica Layout Standards

Owner: the CV@wsl layout-specialist line. **Living doc — grow it as you go.** These are the
HM-ratified primitives + the disciplines that keep two CV instances working in parallel without
collisions. Post-its/fpostit are Glosse's; content is HM's; **everything else layout is ours.**
Build the standards, not the proxy-prompts.

---

## 1 · Content-width is the central layout primitive (HM-ratified)

- **Non-scientific** pages (landing, ethnography, context): content lives in a **90rem centered**
  container.
- **Scientific** (`/discourse` only): a 90rem container holding a **56rem left-aligned** prose
  column; the right is the gloss-lane. Prose-left **==** header-left.
- In code: [`MagnificaPageLayout.vue`](./MagnificaPageLayout.vue) `variant="standard" | "scientific"`;
  shared rules in [`magnifica-page.css`](./magnifica-page.css).

## 2 · Shared-component changes are opt-in + additive (never regress)

When you touch a **shared / mainline** component (Hero, TopNav, FloatingPostIt, …):

- Add an **opt-in prop (default false)** + gate the new behavior by a class / media-query.
  **The default path must stay byte-identical** (the Demo + every non-magnifica consumer unaffected).
- **Layer additively** — never overwrite an existing transform/positioning. (The Hero cover is
  centered via `left/right + margin-inline`, **not** `translateX`, so its parallax stays alive.)
- Templates in the tree: `Hero` `magnifica` prop · `CardsCanvas` `bounded` prop · `BackSlide` `bounded` prop.
  (Magnifica-only components use `bounded`, not `magnifica` — they're already magnifica; the
  meaningful flag is whether they bound to the column.)

## 3 · Tokens, not hardcodes

- Surfaces → `var(--color-*)` (zero raw hex outside the `var(--…, #fallback)` form).
- Type → `var(--font)` (theme-7 = MonaspaceNeon, already loaded).
- If text/colour renders wrong, **suspect a local override fighting the token** before anything
  else (that was the contrast bug + the font bug).
- **Headings: use `Heading.vue`** — `<Heading is="h1|h2" :overline :headline>` — for every
  hero/board overline-headline. Never hand-roll `overline`+`<h1>` spans (they mis-inherit the
  font + rhythm). It's Prose-wrapped and renders correctly in theme-7 with no per-page typography.
  The magnifica hero recipe: `Hero magnifica` + `Heading` (+ optional bottom-weighted `overlay`
  for legibility on busy images — ethnography uses it; discourse omits it).

## 4 · Branch + PR rhythm (how we avoid colliding)

- Isolated or shared-component work → **own branch off `magnifica-final`** → `gh pr create` → **HM merges**.
- `magnifica-final` is the **destructive deploy lane** (magnifica-only router + app-wide theme-7 +
  auth-gate middleware). **NEVER merge it to `main`** without detailed analysis — only additive
  reusable pieces are cherry-picked to main.
- **Commit often** (so the other instance sees progress). **Flag likely file-overlap in the PR body**
  (e.g. centralizing page CSS edits EthnographyPage/DiscoursePage → trivial merge-resolution; a
  shared component like Hero.vue won't conflict). Branches may be **stacked** (a successor branch off
  an open PR's branch) — note the stack so merge-sequencing is clear.

## 5 · The ~4 layouts

- **Entry** — the gate.
- **Landing** — collapsing header (State A→B) + the 2022 hero shape.
- **Standard** — compact header + 90rem centered (ethnography, context).
- **Scientific** — compact header + 56rem left-lane + right gloss-lane (discourse).

These live in code as `MagnificaPageLayout` + `magnifica-page.css` — the single home for the shell.

## 6 · Full-bleed → 90rem bounding (the wide-viewport gate)

Big visual blocks break out of the 90rem column by design (full-bleed). On wide viewports we bound
them so the whole page reads as one 90rem column:

- **Gate:** `@media (min-width: 96rem)` — the bound expressed as its **geometry** (90rem content
  + 2×3rem gutters), = the canonical `wide` tier (1536px). **Never a magic literal** (the old `1456`
  drifted because the number lost its reason). CSS `@media` can't read `var()`, so the token lives as
  this rem-geometry (or `calc(90rem + 6rem)`), not a custom-property. Magnifica's above-canon tiers
  (1650/1800 gloss · extend-to-1920) are a **named extension** of the canonical scale, not a fork.
- **Bound:** `max-width: 90rem; margin-inline: auto`. Below the gate: full-bleed, unchanged.
- **Hero** → `magnifica` prop (centers cover image + content). **CardsCanvas** → `bounded`
  (max-width+margin only — no overflow/flex/transform — so the sticky scroll-choreography holds).
  **BackSlide** → `bounded` (and switches `background-attachment: fixed → scroll` in the bounded
  state so the image tracks the now-narrower panel instead of the viewport-fixed window).
- The header itself is sticky and **pins across the whole `.magnifica-page`** (it must be a direct
  child of the page, not a height-limited wrapper, or sticky gets zero travel). 90rem inset applied
  via `.magnifica-page > header.mag-header`.

---

## Verification bar (every commit)

`npx vue-tsc --noEmit` 0 · the magnifica + fpostit vitest set green · `npx nitro prepare` ·
`npx vite build`. Auto-commit when green; **push only on HM-OK**. Where a change is visual and not
unit-tested, recommend a `:3001` visual check (`pnpm dev:frontend`) — and for gated rules, check
**both sides** of the breakpoint.

## Boundaries (route elsewhere)

- **Post-its / fpostit / chatbox / scientific-gloss positioning** → **Glosse**.
- **Content** (prose, images, copy, bio) → **HM / sister-1**.
- Everything else layout → this line.

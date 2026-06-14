# ⚠️ `alpha/magnifica-dia-patternC` — ABANDONED (strategy not carried forward)

**Status: CLOSED · 2026-06-12 (HP).** This branch is the third candidate on the held-Dia bench
(§20–§23): **Pattern C — the *distinct* dead-still hold**, NOT Hero's over-tall-sticky-cover. One
`position: fixed` "projector" plate, bounded to the 90rem lane via JS-measured vars, scoped by an
IntersectionObserver, with the plate **cross-fading** between scenes (`/protoc`, two swap-ways:
`?swap=js` IO-driven · `?swap=css` scroll-driven).

**Why abandoned:** the distinct fixed-projector mechanic was a real experiment, not a winner.
Honest finding (recorded in backslide-thread §23): **`position: fixed` is NOT ancestor-purity-
immune** (it re-bases under any ancestor `transform`/`contain`/etc., the same gotcha as sticky) —
so C buys **no robustness** over Hero's behind-layer cover (Patterns A/B), only the one-projector +
cross-fade. The bench chose the Hero-cover hold; C is not the path.

**What survives (the value is preserved, not lost):**
- The **research-pin** — scroll mechanisms + the shutter-sync fix (IO-sets-CSS-var · scroll-state ·
  CSS-carousel) — lives in **backslide-thread §24** and serves the whole bench + the episDesigner.
- The **finding** that an IO-driven state-trigger (not scroll-%) is the robust seam-sync — folds
  into the chosen direction (A/B's shutter or the cross-fade).
- `/protoc` stands as the proof-of-concept of the fixed-projector hold; not carried forward.

Do not build on this branch. The durable record is the backslide-thread (§23 build · §24 research).

— CV technician (Pattern C) · 🌱 · closed at HP's word · 2026-06-12

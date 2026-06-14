/**
 * Demo content · the DiaStage documentation pages (/demo1 simple · /demo2 edge-cases).
 *
 * Not a real magnifica page — a GALLERY that makes the *intended application* of the
 * Dia-primitive legible. Source material is clipped/rearranged from the landing backslides
 * (pope/olah) + /context (the five image-beats are imported live from ./context). Each Dia
 * carries a pop-over note (CardsCanvasItem-shaped → <CalloutPhrase>) explaining the specialty
 * visible there. The notes ARE the documentation; keep them true to the shipped components.
 */

import type { CardsCanvasItem } from '@/components/magnifica/types'

// ── the pope/olah plate · the shared photo cropped two ways (from landing.ts) ──
// One photo (pope Leo + Chris Olah); gravity picks the figure. Placeholder until HP's real images.
const ENCYCLICA = 'res.cloudinary.com/little-papillon/image/upload'
export const popeImg = `https://${ENCYCLICA}/c_fill,g_north_west,w_1600,h_1000/v1780762597/crearis/alamy_pope-leo_chris-olah.jpg`
export const olahImg = `https://${ENCYCLICA}/c_fill,g_south_east,w_1600,h_1000,e_brightness:8/v1780762597/crearis/alamy_pope-leo_chris-olah.jpg`

/** A short held-ground text for the image-led variants (the text recedes to the Grund). */
export const groundText =
    'A ground does not argue. It holds — so the figure that rises against it can be read at all. Here the words step back; the image is the one that speaks.'

// ── the pop-over notes · one per demonstrated Dia (the documentation) ──
// CardsCanvasItem shape: { props: { overline, headline, bodyText, themeColor } } → CalloutPhrase.

export const notes: Record<string, CardsCanvasItem> = {
    // demo1 · the basics
    textLed: {
        props: {
            overline: 'Dia z1 · Figure z2',
            headline: 'TEXT-LED',
            bodyText:
                'The image is a held Dia (z1) — position:sticky, element-anchored (no attachment:fixed), it pins and holds while the prose Figure (z2) rises and scrolls past beside it. The default reading-Dia: the image grounds, the text argues.',
            themeColor: 'green',
        },
    },
    imageLed: {
        props: {
            overline: 'the inverse · roles swapped',
            headline: 'IMAGE-LED',
            bodyText:
                'Now the text recedes to a quiet held ground and the image is the Figure that rises — the important thing. Same z-stack, roles swapped: hold the secondary, raise the primary. Image-as-argument (the BackSlide idea), inside the stage.',
            themeColor: 'yellow',
        },
    },
    textDia: {
        props: {
            overline: 'held via position, not background-image',
            headline: 'A TEXT-DIA',
            bodyText:
                'A held plate can be pure text — position-held, never a CSS background (text-as-background is the Firefox-only element() dead end). The spoken-centre: a thesis that holds dead-still while the page reads around it.',
            themeColor: 'dim',
        },
    },
    shutter: {
        props: {
            overline: 'the Blende · z3',
            headline: 'THE SHUTTER',
            bodyText:
                'The black-between: a container-width blade (z3) that passes over both lanes between scenes, then leaves and a new Dia opens. hero-shaped — flat colour, full-bleed image, or banner — with the dasei separator line that plays the gap. Now-running it is a sticky cover; the scroll-driven future makes it WIPE.',
            themeColor: 'pink',
        },
    },

    // demo2 · the edge-cases
    holdDial: {
        props: {
            overline: 'the #1 dial',
            headline: 'DIA-HOLD NEEDS FIGURE-TRAVEL',
            bodyText:
                'A sticky Dia only holds while its Figure is taller than the stage height (--dia-h). Give it a one-line Figure — like this scene — and the Dia barely pins; it just sits, then leaves. Cures: a min-figure-height / spacer, or the scroll-driven fixed Dia that holds regardless of Figure length.',
            themeColor: 'pink',
        },
    },
    flip: {
        props: {
            overline: 'the Before/After mirror',
            headline: 'LANE FLIP',
            bodyText:
                'Hold the plate on the RIGHT (lane="right") and run the Figure left — the mirror. On the BackSlide this is imageRight; on the Dia it is the lane. Two scenes flipped make the Before/After rhyme: pope held left, then Olah held right.',
            themeColor: 'yellow',
        },
    },
    full: {
        props: {
            overline: 'lane="full"',
            headline: 'FULL-BLEED DIA',
            bodyText:
                'The held plate spans both lanes (lane="full") and the Figure reads OVER it (z2 over z1). The cover only works if the Figure is opaque/legible — gotcha #5: a transparent cover lets the plate read through. Here a dim plate holds while a legible text-card rises over it.',
            themeColor: 'green',
        },
    },
    imageBlade: {
        props: {
            overline: 'hero-shaped',
            headline: 'THE SHUTTER AS IMAGE-BLADE',
            bodyText:
                'The Shutter is not only black — it rents hero.vue mechanics: a full-bleed image blade plus the separator line. The black-between can itself be an image, and (scroll-driven future) wipe across the stage like a real Dia-projector blade.',
            themeColor: 'dim',
        },
    },
    zstack: {
        props: {
            overline: 'the i5 fix',
            headline: 'Z-STACK · SEQUENTIAL SCENES',
            bodyText:
                'Dia z1 < Figure z2 < Shutter z3. Scenes must stay sequential / non-overlapping, or the previous Figure paints over the next Dia (the i5 bug). The Shutter bridges the swap. The scroll-driven version — one fixed Dia, content cross-fades — dissolves the overlap entirely.',
            themeColor: 'pink',
        },
    },
}

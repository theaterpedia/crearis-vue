/**
 * useReleaseAfter · TEMPORARY HACK (HM 2026-06-18 · SATZ).
 *
 * A `released` flag that flips true once the page has scrolled past `vh` viewport-heights.
 * Used to un-stick a held element after one screen: a full-bleed held hero (`.hero-cover`
 * spans the viewport) peeks left/right of the bounded (~90rem) content that scrolls over it
 * for as long as it's held — so we release it at ~100vh and the side-bleed stops.
 *
 * Pure CSS can't release `position: sticky` at an arbitrary scroll-distance (sticky releases
 * at its containing-block edge), so this is the small JS twin of the header's scroll-listener.
 * Bind the flag to a `.released` class that flips the held element `sticky → static`.
 *
 * REAL FIX (later · not this hack): clip/bound the held image to the content column so it
 * never exceeds it — then no release is needed. Tracked in the SATZ-family thread.
 *
 * Hysteresis dead-band (release at `vh`, re-hold only well below) avoids flip-flop at the edge,
 * the same guard MagnificaHeader uses against Chrome scroll-anchoring nudges.
 */
import { ref, onMounted, onUnmounted } from 'vue'

export function useReleaseAfter(vh = 1, deadbandPx = 120) {
    const released = ref(false)

    function onScroll() {
        const threshold = window.innerHeight * vh
        if (!released.value && window.scrollY > threshold) released.value = true
        else if (released.value && window.scrollY < threshold - deadbandPx) released.value = false
    }

    onMounted(() => {
        onScroll() // honor a non-zero initial scroll (reload mid-page)
        window.addEventListener('scroll', onScroll, { passive: true })
    })

    onUnmounted(() => window.removeEventListener('scroll', onScroll))

    return { released }
}

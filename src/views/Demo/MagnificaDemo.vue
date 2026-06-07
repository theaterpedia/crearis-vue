<template>
    <main class="magnifica-demo">
        <section class="intro">
            <h1>Magnifica primitives · component playground</h1>
            <p class="intro-text">
                Visual smoke for the three Magnifica carrier-components per
                <code>crearis:projects/magnifica/docs/howto-blackboard.md</code>
                and <code>howto-panels.md</code>. Scroll down to see the
                sticky-post-its blackboard accumulate, then the image-and-panel
                slides cover/uncover.
            </p>
            <p class="intro-text">
                On desktop (≥768px): post-its pin at their lane positions while
                the blackboard sticks behind them; panel-text sticks to the
                viewport bottom while the background image stays anchored.
            </p>
            <p class="intro-text">
                On mobile (&lt;768px · Option-A per howto-blackboard §5):
                post-its flow vertically · blackboard hidden · panels stack
                column-wise.
            </p>
        </section>

        <CardsCanvas
            :items="sampleItems"
            :rng="seededRng"
        >
            <template #board>
                <p>
                    A persistent body-text region on the blackboard. Visible
                    throughout the section while post-its accumulate around it.
                </p>
            </template>
        </CardsCanvas>

        <section class="between-canvases">
            <h2>↓ Image-and-panel section follows ↓</h2>
        </section>

        <BackSlide
            image="https://picsum.photos/seed/magnifica-1/1600/900"
            image-alt="Demo image 1 · placeholder"
            theme-color="green"
        >
            <h2>If any of this resonates</h2>
            <p>
                Sticky-bottom panel-text · background-image fixed (parallax) on
                desktop · scrolls with section on mobile.
            </p>
        </BackSlide>

        <BackSlide
            image="https://picsum.photos/seed/magnifica-2/1600/900"
            image-alt="Demo image 2 · placeholder"
            theme-color="yellow"
            :image-right="true"
        >
            <h2>Image on the right · variant</h2>
            <p>
                Per howto-panels §5.1 · flex-direction row-reverse on desktop.
            </p>
        </BackSlide>

        <BackSlide
            image="https://picsum.photos/seed/magnifica-1/1600/900"
            image-alt="Demo image 1 continued · cover-uncover sequence"
            theme-color="pink"
        >
            <h2>Cover/uncover with same image (§5.3)</h2>
            <p>
                Reusing the first image url with a different colored panel.
                Reader perceives one continuous image being revealed in two
                different colour-frames.
            </p>
        </BackSlide>

        <section class="end">
            <p>End of demo · components: PostIt · CardsCanvas · BackSlide.</p>
        </section>
    </main>
</template>

<script setup lang="ts">
/**
 * MagnificaDemo · visual playground for the three carrier-components per
 * dispatch #4 §5 (HM-verifiable demo / playground page before
 * the second-branch hardcoded site work starts).
 *
 * Not in mainline routing — registered at `/demo/magnifica` purely for
 * smoke-test purposes. Sample content uses placeholder texts from the
 * Magnifica candidate-1c website-draft v0.5 for visual fidelity.
 */
import CardsCanvas from '@/components/magnifica/CardsCanvas.vue'
import BackSlide from '@/components/magnifica/BackSlide.vue'
import type { CardsCanvasItem } from '@/components/magnifica/types'

// Deterministic rng for the demo · keeps the lane-distribution stable
// across reloads so HM-visual-verify always sees the same layout.
function makeSeededRng(seed: number): () => number {
    let s = seed
    return () => {
        s = (s * 9301 + 49297) % 233280
        return s / 233280
    }
}

const seededRng = makeSeededRng(42)

// Sample post-its in the JSON-items shape · subset of the candidate-1c
// website-draft content. Mix of authored positions (first 3) and
// auto-distribute (last 4 · lane-distribution fills top/left/rotate).
const sampleItems: CardsCanvasItem[] = [
    {
        props: {
            overline: 'You said at the Vatican',
            headline: '"people outside those incentives, who care about things going well"',
            themeColor: 'green',
            top: '8%',
            left: '5%',
            rotate: '-2',
            classes: 'mt-12',
        },
    },
    {
        props: {
            overline: 'and closed with',
            headline: '"moral voices the incentives cannot bend"',
            themeColor: 'green',
            top: '10%',
            left: '62%',
            rotate: '+3',
            classes: 'mt-32',
        },
    },
    {
        props: {
            overline: 'the question that surfaces',
            headline: 'How do such voices actually enter the labs?',
            bodyText:
                'Not as critique-from-outside — that has been tried, and it tends to bounce off the walls of the laboratory.',
            themeColor: 'yellow',
            top: '32%',
            left: '18%',
            rotate: '-1',
            classes: 'mt-32',
        },
    },
    // Auto-distributed below · CardsCanvas fills top/left/rotate via lane-distribution
    {
        props: {
            overline: 'as a voice rooted in lived practice',
            headline: 'auto-distributed item · lane fill-in',
            themeColor: 'yellow',
        },
    },
    {
        props: {
            headline: 'thirty years of theaterpedagogik',
            bodyText: 'Not as theory — as the daily work of a small institute in Bavaria.',
            themeColor: 'pink',
        },
    },
    {
        props: {
            overline: 'auto · lane round-robin continues',
            headline: 'fifth item · lane 0 wraps',
            themeColor: 'green',
        },
    },
    {
        props: {
            headline: 'sixth item · lane 1',
            themeColor: 'pink',
        },
    },
]
</script>

<style scoped>
.magnifica-demo {
    background: #1d1b1a;
    color: #f4f4f4;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}

.intro {
    padding: 3rem 1.5rem;
    max-width: 48rem;
    margin: 0 auto;
}

.intro h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 1rem;
}

.intro-text {
    font-size: 1rem;
    line-height: 1.6;
    margin: 0 0 1rem;
}

.intro code {
    font-family: ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace;
    font-size: 0.9em;
    background: #2a2828;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
}

.between-canvases {
    padding: 3rem 1.5rem;
    text-align: center;
}

.between-canvases h2 {
    font-size: 1.25rem;
    opacity: 0.6;
}

.end {
    padding: 4rem 1.5rem;
    text-align: center;
    font-size: 0.9rem;
    opacity: 0.6;
}
</style>

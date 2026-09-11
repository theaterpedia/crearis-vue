<!--
  UiaActors · the Akteure block. `shape: cards` · taxonomy Akteure (yellow).

  §4's Akteure shape is the wide landscape card: banner + avatar + role + pill
  (`UI_community_3colors_3taxonomies_3shapes.png`). Two deliberate reductions
  for this round, both because the data isn't there yet rather than because the
  shape is wrong:

  - **No banner until a real URL exists.** Every `image:` is `'TODO HP'` (§8).
    Eight full-width „Bild folgt" placeholders would swamp the band, so the
    banner renders only once HP fills a URL in — the card upgrades itself.
  - **No „>> mehr erfahren <<" pill.** There is nothing behind it this round —
    person-pages and org-pages are both in the negative spec (§1). A pill that
    goes nowhere is the same lie as a nav that hides what doesn't exist.

  ── Randomised order · the owners' own instruction ────────────────────────────
  The 3-shapes mockup carries the note „muss random vorkommen die Reihnfolge",
  and `content/landing.ts` repeats it. Shuffled once per mount, not per render:
  a list that reorders itself while you read it is a different (worse) thing.

  ── Names ─────────────────────────────────────────────────────────────────────
  People are pseudonym codes (`MATTIS30`, `JOLANDA30`); clearnames live only in
  the gitignored `.pseudonyms.env` (§7). Organisations stay clear-named by
  decision (HP 2026-07-27).
-->

<template>
    <div class="uia-actors" :style="vars">
        <ul v-if="shuffledPeople.length" class="uia-actors-grid">
            <li v-for="person in shuffledPeople" :key="person.code" class="uia-actor">
                <UiaImage v-if="hasRealImage(person.image)" :src="person.image"
                    :alt="`${person.code} · ${person.role}`" ratio="banner" />
                <div class="uia-actor-body">
                    <span class="uia-actor-avatar" aria-hidden="true">{{ initials(person.code) }}</span>
                    <span class="uia-actor-name">{{ person.code }}</span>
                    <span class="uia-actor-role">{{ person.role }}</span>
                </div>
            </li>
        </ul>

        <ul v-if="shuffledOrgs.length" class="uia-actors-grid uia-actors-grid-orgs">
            <li v-for="org in shuffledOrgs" :key="org.name" class="uia-actor uia-actor-org">
                <div class="uia-actor-body">
                    <span class="uia-actor-name">{{ org.name }}</span>
                    <span class="uia-actor-role">{{ org.role }}</span>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import UiaImage from './UiaImage.vue'
import { taxonomyVars } from './uiaTaxonomy'
import { hasRealImage } from './uiaItems'

interface UiaPerson {
    code: string
    role: string
    image?: string
}

interface UiaOrg {
    name: string
    role: string
}

const props = withDefaults(
    defineProps<{
        people?: ReadonlyArray<UiaPerson>
        orgs?: ReadonlyArray<UiaOrg>
    }>(),
    { people: () => [], orgs: () => [] },
)

const vars = computed(() => taxonomyVars('akteure'))

/** Fisher–Yates on a copy. Called once at setup, never in a computed. */
function shuffle<T>(items: ReadonlyArray<T>): T[] {
    const out = [...items]
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const a = out[i] as T
        const b = out[j] as T
        out[i] = b
        out[j] = a
    }
    return out
}

const shuffledPeople = ref<UiaPerson[]>(shuffle(props.people))
const shuffledOrgs = ref<UiaOrg[]>(shuffle(props.orgs))

/** First two characters of the code — the pseudonym stands in for the portrait. */
function initials(code: string): string {
    return code.slice(0, 2).toUpperCase()
}
</script>

<style scoped>
.uia-actors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 0.9rem;
    margin: 0;
    padding: 0;
    list-style: none;
}

.uia-actors-grid-orgs {
    margin-top: 0.9rem;
}

/* Taxonomy chrome: the yellow frame. Never a filled yellow row — that would
   read as „Schwelle noch nicht erreicht" (§4). */
.uia-actor {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: var(--color-card-bg);
    color: var(--color-card-contrast);
    border: 3px solid var(--uia-taxonomy-bg);
}

.uia-actor-body {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.8rem 0.9rem;
}

.uia-actor-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    margin-bottom: 0.35rem;
    border-radius: 50%;
    background-color: var(--uia-taxonomy-bg);
    color: var(--uia-taxonomy-contrast);
    font-size: 0.8125rem;
    font-weight: 700;
    letter-spacing: 0.04em;
}

.uia-actor-name {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.25;
}

.uia-actor-role {
    font-size: 0.8125rem;
    font-weight: 300;
    line-height: 1.4;
    color: var(--color-muted-contrast);
}
</style>

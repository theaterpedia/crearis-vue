<!--
  UiaPageFrame · the shell all three uia views sit in.

  Not in the prompt's file-list, but wiring PageLayout + nav + theme + footer
  three times over would be three chances to drift. One frame, three pages.

  ── setSiteLayout="centered", not "fullTwo" (§5) ──────────────────────────────
  `showRightSidebar` is false for `centered` (see `PageLayout.vue:328`). uia's
  two columns live INSIDE each `<Section>`, not in PageLayout's aside. §5 calls
  getting this wrong "the one mistake that costs a rebuild", so it is set here,
  once, and no page overrides it.

  ── Theme (§3) ────────────────────────────────────────────────────────────────
  Theme 3 „Institut" is the initial theme — primary h191 is uia's own teal
  wordmark, secondary h43 their posters' orange ground, and its semantic triad
  (positive h150 · negative h30 · warning h111) does not collide, which is what
  makes §4's taxonomy/status split legible at all.

  No colour is hardcoded anywhere in `views/Uia/` — everything reads
  `--color-*`, so the ThemeDropdown in the topnav actually switches the site.
  HP wants to compare, and `setTheme` still accepts 0–7.

  We deliberately do NOT call `useTheme().init()`: it awaits `getThemes()`, and a
  throw there would skip `applyInvertedToDocument()` + `extractImageDimensions()`.
  `setTheme` reaches the bundled `server/themes/*.json` on its own when
  `/api/themes` is missing — which is the normal case for this deploy (§2).

  ── Nav (§1) ──────────────────────────────────────────────────────────────────
  All four navstops render and stay reachable. `ready: false` ones route to the
  shared stub. A nav that lies about what exists is worse than a nav with a stub
  behind it, so nothing is filtered out here.
-->

<template>
    <div class="uia-page">
        <!--
          showLogo="no" · this is uia, not Theaterpedia. `Logo.vue` renders the
          Theaterpedia wordmark inside an <h1>, so leaving it on put „Theaterpedia
          Theaterpädagogik suchen und finden" in the uia topnav AND made it the
          first h1 on every page, ahead of the real headline. uia's own logo ring
          is a pending HP image (§8); until then no wordmark beats the wrong one.

          allowActions="yes" · the landing runs navbarMode="home", and TopNav's
          'home' default hides the actions-slot along with the logo — which hid
          the theme switcher exactly where HP most wants it. §3 says leave it
          reachable, so the two knobs are set independently of navbarMode.
        -->
        <PageLayout setSiteLayout="centered" :navItems="navItems" :navbarMode="navbarMode" showLogo="no"
            allowActions="yes">
            <!-- Theme switcher · left reachable so HP can compare (§3) -->
            <template #topnav-actions>
                <ThemeDropdown />
            </template>

            <template #header>
                <slot name="header" />
            </template>

            <slot />

            <template #footer>
                <UiaSiteFooter />
            </template>
        </PageLayout>
    </div>
</template>

<script setup lang="ts">
import { onMounted, watchEffect } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import ThemeDropdown from '@/components/ThemeDropdown.vue'
import { useTheme } from '@/composables/useTheme'
import type { TopnavParentItem } from '@/components/TopNav.vue'
import UiaSiteFooter from './UiaSiteFooter.vue'
import { navItems as uiaNavItems } from './content/nav'

const props = withDefaults(
    defineProps<{
        /** `document.title` for this route. */
        title: string
        navbarMode?: 'default' | 'home' | 'page'
    }>(),
    { navbarMode: 'page' },
)

/**
 * `UiaNavItem` extends `TopnavParentItem` with `ready`; TopNav ignores the extra
 * field, so the list passes through as-is and every navstop stays visible.
 */
const navItems: TopnavParentItem[] = uiaNavItems.map((item) => ({ label: item.label, link: item.link }))

const { setTheme, extractImageDimensions } = useTheme()

watchEffect(() => {
    if (typeof document !== 'undefined') document.title = props.title
})

onMounted(async () => {
    try {
        await setTheme(3, 'initial')
    } catch (error) {
        // Backend-less and no bundled theme-3.json would be a build problem, not a
        // runtime one — but a themeless uia is still readable, so never white-screen.
        console.error('uia · theme 3 could not be applied:', error)
    }
    extractImageDimensions()
})
</script>

<style scoped>
.uia-page {
    min-height: 100vh;
    background-color: var(--color-bg);
    color: var(--color-contrast);
}
</style>

<template>
    <a
        v-if="mode === 'public'"
        :href="editHref"
        class="edit-link"
        rel="noopener"
    >
        Edit this page
    </a>
</template>

<script setup lang="ts">
/**
 * EditLink — Phase-A C11 · plan §9b.
 *
 * Always-visible "Edit this page" cross-domain anchor for public-mode SPA
 * surfaces (utopia-in-action.de). Hidden in app-mode (my.theaterpedia.org)
 * — there the user is already on the auth-gated app and the edit-perspective
 * is the canonical render-mode.
 *
 * No cookie-detection across-domains (Option-α confirmed per v0.2 §1.1 +
 * decision-record). NGINX `auth_request` on my.theaterpedia.org handles the
 * unauth case (401 → 302 to /login → return per v0.2 §2.4 Flow-B step 3a).
 *
 * Path-construction note · grounded-theory deviation from plan §9b.2 sketch:
 * the plan's sketch uses `my.theaterpedia.org/sites/uia/${path-without-slash}`
 * which assumes future-state host-aware routing (utopia-in-action.de serves
 * `/posts/foo` style URLs without the `/sites/uia/` prefix · plan §15 step 1
 * framing). The CURRENT SPA routes are `/sites/:domaincode/...` (see
 * src/router/index.ts) so utopia-in-action.de URLs today are
 * `/sites/uia/posts/foo` style. To make the Edit-link work TODAY without
 * blocking on Phase-B host-aware routing, this component uses
 * `my.theaterpedia.org${route.path}` — host-rewrite only, no path-prefix
 * injection. When host-aware routing lands (and route.path becomes
 * `/posts/foo` on the public domain), the prefix-injection logic from the
 * plan's sketch will need to land here.
 *
 * Copy ("Edit this page") is placeholder pending HM-review per plan §9b.2.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHostMode } from '@/composables/useHostMode'

const APP_HOST = 'https://my.theaterpedia.org'

const route = useRoute()
const { mode } = useHostMode()
const editHref = computed(() => `${APP_HOST}${route.path}`)
</script>

<style scoped>
.edit-link {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
    padding: 0.5rem 1rem;
    background-color: #1f2937;
    color: white;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 600;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: background-color 0.15s ease;
}

.edit-link:hover {
    background-color: #111827;
}
</style>

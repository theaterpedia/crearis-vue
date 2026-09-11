<!--
  SiteNoticePostits · temporal site announcements as floating post-its.

  Mount once per public surface (project home, /start). Resolves the
  domaincode's active notices (utils/siteNotices — the third member of the
  domaincode seam-family), registers them with the shipped fpostit engine and
  opens them. One action: „Alles klar" closes.

  Deliberately thin: the ENGINE is A's design-lane (postits thread); this
  component only carries the two HD-approved site notices and stays out of
  strategy questions (one mode per page etc. — the notices float, they are
  not a page-mode).
-->

<template>
    <FpostitRenderer />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import FpostitRenderer from '@/fpostit/components/FpostitRenderer.vue'
import { useFpostitController } from '@/fpostit/composables/useFpostitController'
import { resolveSiteNotices, isNoticeActive } from '@/utils/siteNotices'

const props = defineProps<{
    domaincode: string
    surface: 'site' | 'start'
}>()

const controller = useFpostitController()

onMounted(() => {
    const notices = resolveSiteNotices(props.domaincode, props.surface)
    for (const notice of notices) {
        // Register ALWAYS (so a cta can open the card any time);
        // auto-open only inside the notice's window.
        controller.create({
            key: notice.key,
            title: notice.title,
            content: notice.html,
            color: notice.color,
            rotation: notice.rotation,
            hlogic: 'default',
            actions: [{ label: 'Alles klar', handler: (close: () => void) => close() }],
        })
        if (isNoticeActive(notice)) controller.openPostit(notice.key)
    }
})
</script>

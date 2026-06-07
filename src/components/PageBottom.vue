<!--
  PageBottom — consulting call + email CTA lanes.

  Reads from project.config.pageBottom.consulting per T1-γ / Canvas-2c §preset-dim-7.
  Shape:
    project.config.pageBottom.consulting: {
      call: 'none' | '15-mins' | '30-mins',
      email: boolean,
      callHref?: string,       // optional: scheduling link
      emailHref?: string,      // optional: mailto: target
    }

  Graceful default: if no config, render nothing.
-->

<script setup lang="ts">
import { computed } from 'vue'

type CallDuration = 'none' | '15-mins' | '30-mins'

interface ConsultingConfig {
    call?: CallDuration | string
    email?: boolean
    callHref?: string
    emailHref?: string
}

interface ProjectConfig {
    pageBottom?: {
        consulting?: ConsultingConfig
    }
    [key: string]: unknown
}

const props = defineProps<{
    /** Raw project.config JSONB object; may be null if not loaded */
    projectConfig?: ProjectConfig | null
    /** Fallback email when consulting.emailHref not set (e.g. project.owner_sysmail) */
    fallbackEmail?: string
}>()

const consulting = computed<ConsultingConfig>(
    () => props.projectConfig?.pageBottom?.consulting ?? {},
)

const callLabel = computed<string | null>(() => {
    switch (consulting.value.call) {
        case '15-mins':
            return '15-min Gespräch'
        case '30-mins':
            return '30-min Gespräch'
        default:
            return null
    }
})

const callVisible = computed(() => callLabel.value !== null)

const emailVisible = computed(() => consulting.value.email === true)

const emailHref = computed(() => {
    if (consulting.value.emailHref) return consulting.value.emailHref
    if (props.fallbackEmail) return `mailto:${props.fallbackEmail}`
    return null
})

const callHref = computed(() => consulting.value.callHref ?? null)

const anyVisible = computed(() => callVisible.value || emailVisible.value)
</script>

<template>
    <div v-if="anyVisible" class="page-bottom">
        <a v-if="callVisible" class="page-bottom__lane page-bottom__lane--call"
            :href="callHref || undefined" :aria-disabled="callHref ? undefined : 'true'">
            <span class="page-bottom__icon" aria-hidden="true">📞</span>
            <span class="page-bottom__label">{{ callLabel }}</span>
        </a>

        <a v-if="emailVisible && emailHref" class="page-bottom__lane page-bottom__lane--email"
            :href="emailHref">
            <span class="page-bottom__icon" aria-hidden="true">✉️</span>
            <span class="page-bottom__label">E-Mail</span>
        </a>
    </div>
</template>

<style scoped>
.page-bottom {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    justify-content: center;
    flex-wrap: wrap;
    border-top: 1px solid var(--color-border, #e5e7eb);
}

.page-bottom__lane {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem;
    background: var(--color-surface-muted, #f3f4f6);
    color: var(--color-text, #111827);
    text-decoration: none;
    font-weight: 500;
    transition: background 120ms ease;
}

.page-bottom__lane:hover {
    background: var(--color-surface-hover, #e5e7eb);
}

.page-bottom__lane[aria-disabled="true"] {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
}

.page-bottom__icon {
    font-size: 1.1rem;
}
</style>

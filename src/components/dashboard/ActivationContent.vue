<!--
  ActivationContent.vue - Extracted activation checklist and button
  
  Used by ProjectSettingsPanel in both mobile (inline) and desktop (active panel) modes.
-->
<template>
    <div class="activate-content">
        <div class="info-card">
            <p class="info-text">
                After activation, the project enters <strong>Draft Mode</strong>.
                You can make further adjustments and publish later.
            </p>
        </div>

        <div class="checklist">
            <h4>Before activation:</h4>
            <ul class="check-items">
                <li class="check-item">
                    <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18">
                        <path
                            d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
                    </svg>
                    <span>Project information complete</span>
                </li>
                <li class="check-item">
                    <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18">
                        <path
                            d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
                    </svg>
                    <span>Users and roles configured</span>
                </li>
                <li class="check-item">
                    <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18">
                        <path
                            d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
                    </svg>
                    <span>Theme and layout customized</span>
                </li>
            </ul>
        </div>

        <button v-if="showButton" class="btn-activate" @click="$emit('activate')">
            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20">
                <path
                    d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
            </svg>
            Activate Project
        </button>
    </div>
</template>

<script setup lang="ts">
interface Props {
    showButton?: boolean
}

withDefaults(defineProps<Props>(), {
    showButton: true
})

defineEmits<{
    'activate': []
}>()
</script>

<style scoped>
.activate-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.info-card {
    background: var(--color-muted-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-md);
}

.info-text {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--color-contrast);
}

.checklist h4 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.check-items {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.check-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 0.875rem;
    color: var(--color-positive-bg);
}

.check-item span {
    color: var(--color-contrast);
}

.btn-activate {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-lg);
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    border: none;
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    align-self: flex-start;
}

.btn-activate:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
}
</style>

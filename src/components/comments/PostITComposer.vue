<template>
    <div class="postit-composer" :class="[color, { compact, loading: isLoading }]">
        <!-- Tape effect -->
        <div class="tape" />

        <!-- Textarea -->
        <textarea ref="textareaRef" v-model="content" class="composer-textarea" :placeholder="placeholder"
            :disabled="isLoading" @keydown.ctrl.enter="handleSubmit" @keydown.meta.enter="handleSubmit" />

        <!-- Footer -->
        <div class="composer-footer">
            <!-- Character count -->
            <span class="char-count" :class="{ warning: isNearLimit, error: isOverLimit }">
                {{ content.length }}/{{ maxLength }}
            </span>

            <!-- Markdown hint -->
            <span class="markdown-hint" v-if="!compact">
                Markdown unterstützt: **fett**, *kursiv*, `code`
            </span>

            <!-- Actions -->
            <div class="composer-actions">
                <button v-if="showCancel" type="button" class="btn-cancel" :disabled="isLoading" @click="handleCancel">
                    Abbrechen
                </button>
                <button type="button" class="btn-submit" :disabled="!canSubmit || isLoading" @click="handleSubmit">
                    {{ isLoading ? 'Senden...' : submitLabel }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { PostITColor } from '@/composables/usePostITComments'

const props = withDefaults(defineProps<{
    color?: PostITColor
    placeholder?: string
    submitLabel?: string
    isLoading?: boolean
    compact?: boolean
    showCancel?: boolean
    maxLength?: number
    autofocus?: boolean
}>(), {
    color: 'yellow',
    placeholder: 'Kommentar schreiben...',
    submitLabel: 'Senden',
    isLoading: false,
    compact: false,
    showCancel: true,
    maxLength: 2000,
    autofocus: false,
})

const emit = defineEmits<{
    submit: [content: string]
    cancel: []
}>()

const content = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Validation
const canSubmit = computed(() => {
    const trimmed = content.value.trim()
    return trimmed.length > 0 && trimmed.length <= props.maxLength
})

const isNearLimit = computed(() => {
    return content.value.length > props.maxLength * 0.9
})

const isOverLimit = computed(() => {
    return content.value.length > props.maxLength
})

// Handlers
function handleSubmit() {
    if (!canSubmit.value || props.isLoading) return

    emit('submit', content.value.trim())
    content.value = ''
}

function handleCancel() {
    content.value = ''
    emit('cancel')
}

// Autofocus
onMounted(() => {
    if (props.autofocus) {
        textareaRef.value?.focus()
    }
})
</script>

<style scoped>
/* Following Opus CSS conventions */

.postit-composer {
    --note-bg: var(--postit-yellow, oklch(92% 0.12 95));
    --note-text: oklch(30% 0.05 95);

    position: relative;
    background: var(--note-bg);
    padding: 1.25rem 1rem 1rem;
    font-family: var(--font);
    box-shadow: var(--postit-shadow, 2px 3px 8px oklch(0% 0 0 / 0.15));
}

.postit-composer.compact {
    padding: 0.75rem;
}

/* Color variants */
.postit-composer.yellow {
    --note-bg: var(--postit-yellow, oklch(92% 0.12 95));
    --note-text: oklch(30% 0.05 95);
}

.postit-composer.orange {
    --note-bg: var(--postit-orange, oklch(85% 0.14 65));
    --note-text: oklch(28% 0.08 65);
}

.postit-composer.purple {
    --note-bg: var(--postit-purple, oklch(82% 0.12 300));
    --note-text: oklch(28% 0.08 300);
}

.postit-composer.blue {
    --note-bg: var(--postit-blue, oklch(85% 0.10 230));
    --note-text: oklch(28% 0.06 230);
}

.postit-composer.green {
    --note-bg: var(--postit-green, oklch(82% 0.12 145));
    --note-text: oklch(25% 0.08 145);
}

.postit-composer.pink {
    --note-bg: var(--postit-pink, oklch(82% 0.14 350));
    --note-text: oklch(28% 0.10 350);
}

/* Loading state */
.postit-composer.loading {
    opacity: 0.7;
    pointer-events: none;
}

/* Tape */
.tape {
    position: absolute;
    top: -0.375rem;
    left: 50%;
    transform: translateX(-50%) rotate(-2deg);
    width: 3rem;
    height: 1rem;
    background: oklch(90% 0.03 95 / 0.7);
    box-shadow: 0 1px 2px oklch(0% 0 0 / 0.1);
}

/* Textarea */
.composer-textarea {
    width: 100%;
    min-height: 80px;
    padding: 0.5rem;
    background: oklch(100% 0 0 / 0.4);
    border: 1px solid oklch(0% 0 0 / 0.15);
    border-radius: var(--radius-small, 0.25rem);
    font-family: var(--font);
    font-size: 0.875rem;
    color: var(--note-text);
    resize: vertical;
    transition: var(--transition);
}

.postit-composer.compact .composer-textarea {
    min-height: 60px;
    font-size: 0.8125rem;
}

.composer-textarea:focus {
    outline: none;
    background: oklch(100% 0 0 / 0.6);
    border-color: oklch(0% 0 0 / 0.25);
}

.composer-textarea::placeholder {
    color: oklch(0% 0 0 / 0.4);
}

/* Footer */
.composer-footer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.char-count {
    font-size: 0.6875rem;
    color: oklch(0% 0 0 / 0.5);
}

.char-count.warning {
    color: oklch(55% 0.15 85);
}

.char-count.error {
    color: oklch(55% 0.18 25);
}

.markdown-hint {
    font-size: 0.625rem;
    color: oklch(0% 0 0 / 0.4);
    flex: 1;
}

/* Actions */
.composer-actions {
    display: flex;
    gap: 0.5rem;
    margin-left: auto;
}

.btn-cancel,
.btn-submit {
    padding: 0.375rem 0.75rem;
    font-family: var(--font);
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: var(--radius-small, 0.25rem);
    cursor: pointer;
    transition: var(--transition);
}

.btn-cancel {
    background: transparent;
    border: 1px solid oklch(0% 0 0 / 0.2);
    color: var(--note-text);
}

.btn-cancel:hover:not(:disabled) {
    background: oklch(0% 0 0 / 0.05);
}

.btn-submit {
    background: oklch(50% 0.12 145);
    border: none;
    color: white;
}

.btn-submit:hover:not(:disabled) {
    background: oklch(45% 0.12 145);
}

.btn-submit:disabled,
.btn-cancel:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Responsive */
@media (max-width: 640px) {
    .markdown-hint {
        display: none;
    }

    .composer-footer {
        justify-content: space-between;
    }

    .composer-actions {
        width: 100%;
        margin-top: 0.5rem;
    }

    .btn-cancel,
    .btn-submit {
        flex: 1;
    }
}
</style>

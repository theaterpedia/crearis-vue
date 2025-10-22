<script setup lang="ts">
/**
 * AdminAction - Configurable stepper-based modal for admin actions
 * 
 * Responsive:
 * - Mobile: fullscreen
 * - Desktop: ~800px popup with auto height (inner scroll if needed)
 * 
 * Patterns:
 * - initStep: none = no stepper, options/select/collect = show stepper
 * - finalStep: inline = embed result, summary/full = dedicated step
 * - If initStep=none + finalStep=inline: hide stepper column
 */
import { ref, computed, watch } from 'vue'

export interface AdminActionProps {
  modelValue?: boolean
  initStep?: 'none' | 'options' | 'select' | 'collect'
  finalStep?: 'inline' | 'summary' | 'full'
  actionType?: 'create' | 'alter' | 'add' | 'remove' | 'custom'
  coreType?: 'user' | 'project' | 'domain' | 'instructor'
  supportType?: 'user' | 'project' | 'domain' | 'instructor'
  coreId?: string | number | null
  supportId?: string | number | null
  fields?: 'default' | 'all' | string[]
}

const props = withDefaults(defineProps<AdminActionProps>(), {
  modelValue: false,
  initStep: 'none',
  finalStep: 'inline',
  actionType: 'create',
  coreType: 'user',
  supportType: undefined,
  coreId: null,
  supportId: null,
  fields: 'default'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:coreId': [value: string | number | null]
  'update:supportId': [value: string | number | null]
  'complete': [result: any]
  'cancel': []
}>()

// Internal state
const currentStep = ref(1)
const maxStep = ref(3)
const formData = ref<Record<string, any>>({})

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const showStepper = computed(() => {
  return !(props.initStep === 'none' && props.finalStep === 'inline')
})

const steps = computed(() => {
  const stepList: { id: number; label: string; status: 'complete' | 'current' | 'upcoming' }[] = []

  // Add init step if not 'none'
  if (props.initStep !== 'none') {
    stepList.push({
      id: 1,
      label: props.initStep.charAt(0).toUpperCase() + props.initStep.slice(1),
      status: currentStep.value > 1 ? 'complete' : currentStep.value === 1 ? 'current' : 'upcoming'
    })
  }

  // Add main action step
  const mainStepId = props.initStep === 'none' ? 1 : 2
  stepList.push({
    id: mainStepId,
    label: props.actionType.charAt(0).toUpperCase() + props.actionType.slice(1),
    status: currentStep.value > mainStepId ? 'complete' : currentStep.value === mainStepId ? 'current' : 'upcoming'
  })

  // Add final step if not 'inline'
  if (props.finalStep !== 'inline') {
    const finalStepId = props.initStep === 'none' ? 2 : 3
    stepList.push({
      id: finalStepId,
      label: props.finalStep.charAt(0).toUpperCase() + props.finalStep.slice(1),
      status: currentStep.value > finalStepId ? 'complete' : currentStep.value === finalStepId ? 'current' : 'upcoming'
    })
  }

  return stepList
})

// Methods
const nextStep = () => {
  if (currentStep.value < maxStep.value) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const complete = (result?: any) => {
  emit('complete', result || formData.value)
  close()
}

const cancel = () => {
  emit('cancel')
  close()
}

const close = () => {
  isOpen.value = false
  // Reset state after animation
  setTimeout(() => {
    currentStep.value = 1
    formData.value = {}
  }, 300)
}

// Watch for step changes to adjust max steps
watch(() => [props.initStep, props.finalStep], () => {
  maxStep.value = steps.value.length
}, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="admin-action-overlay" @click.self="cancel">
        <div class="admin-action-modal">
          <!-- Stepper Column (conditional) -->
          <div v-if="showStepper" class="admin-action-stepper">
            <div class="stepper-header">
              <h3 class="stepper-title">
                {{ actionType.charAt(0).toUpperCase() + actionType.slice(1) }}
                {{ coreType.charAt(0).toUpperCase() + coreType.slice(1) }}
              </h3>
            </div>

            <div class="stepper-steps">
              <div v-for="step in steps" :key="step.id" class="stepper-step" :class="[`step-${step.status}`]">
                <div class="step-indicator">
                  <div v-if="step.status === 'complete'" class="step-icon step-icon-complete">
                    ✓
                  </div>
                  <div v-else class="step-icon" :class="{ 'step-icon-current': step.status === 'current' }">
                    {{ step.id }}
                  </div>
                </div>
                <div class="step-label">{{ step.label }}</div>
              </div>
            </div>
          </div>

          <!-- Content Panel -->
          <div class="admin-action-panel">
            <div class="panel-header">
              <button class="panel-close" @click="cancel" aria-label="Close">
                ×
              </button>
            </div>

            <div class="panel-content">
              <!-- Slot for dynamic panel content -->
              <slot name="panel" :current-step="currentStep" :form-data="formData" :next-step="nextStep"
                :prev-step="prevStep" :complete="complete" :cancel="cancel">
                <div class="default-panel">
                  <h2>Admin Action</h2>
                  <p>Action: {{ actionType }}</p>
                  <p>Core Type: {{ coreType }}</p>
                  <p v-if="supportType">Support Type: {{ supportType }}</p>
                  <p>Step: {{ currentStep }} / {{ maxStep }}</p>
                </div>
              </slot>
            </div>

            <div class="panel-footer">
              <slot name="footer" :current-step="currentStep" :next-step="nextStep" :prev-step="prevStep"
                :complete="complete" :cancel="cancel">
                <button v-if="currentStep > 1" class="btn btn-secondary" @click="prevStep">
                  Back
                </button>
                <button v-if="currentStep < maxStep" class="btn btn-primary" @click="nextStep">
                  Next
                </button>
                <button v-else class="btn btn-primary" @click="complete">
                  Complete
                </button>
              </slot>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Overlay */
.admin-action-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* Modal Container */
.admin-action-modal {
  display: flex;
  background: var(--color-background);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  max-height: 90vh;
  width: 100%;
  max-width: 800px;
}

/* Stepper Column */
.admin-action-stepper {
  width: 240px;
  background: var(--color-accent-bg);
  padding: 2rem 1.5rem;
  border-right: 1px solid var(--color-border);
  flex-shrink: 0;
}

.stepper-header {
  margin-bottom: 2rem;
}

.stepper-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-accent-contrast);
  margin: 0;
  font-family: var(--headings);
}

.stepper-steps {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stepper-step {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.step-indicator {
  flex-shrink: 0;
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  background: var(--color-background);
  color: var(--color-text-muted);
  border: 2px solid var(--color-border);
  transition: all 0.2s;
}

.step-icon-current {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.step-icon-complete {
  background: var(--color-success);
  color: white;
  border-color: var(--color-success);
}

.step-label {
  flex: 1;
  padding-top: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.step-current .step-label {
  color: var(--color-heading);
  font-weight: 600;
}

/* Content Panel */
.admin-action-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.panel-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  background: var(--color-bg);
}

.panel-close {
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  color: var(--color-muted-contrast);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.panel-close:hover {
  background: var(--color-muted-bg);
  color: var(--color-contrast);
}

.panel-content {
  flex: 1;
  padding: 2rem 1.5rem;
  overflow-y: auto;
  background: var(--color-muted-bg);
}

.panel-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Default Panel Styles */
.default-panel h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.default-panel p {
  margin: 0.5rem 0;
  color: var(--color-text);
}

/* Button Styles */
.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  font-family: var(--font);
}

.btn-primary {
  background: var(--color-primary-bg);
  color: var(--color-primary-contrast);
  border-color: var(--color-primary-bg);
}

.btn-primary:hover {
  opacity: 0.85;
}

.btn-secondary {
  background: var(--color-muted-bg);
  color: var(--color-muted-contrast);
  border-color: var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-accent-bg);
  color: var(--color-accent-contrast);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .admin-action-overlay {
    padding: 0;
    align-items: stretch;
  }

  .admin-action-modal {
    flex-direction: column;
    border-radius: 0;
    max-height: 100vh;
    height: 100vh;
    max-width: 100%;
  }

  .admin-action-stepper {
    width: 100%;
    padding: 1.5rem 1rem;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }

  .stepper-steps {
    flex-direction: row;
    gap: 1rem;
    overflow-x: auto;
  }

  .stepper-step {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    min-width: 80px;
  }

  .step-label {
    text-align: center;
    padding-top: 0;
  }

  .panel-content {
    padding: 1.5rem 1rem;
  }
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .admin-action-modal,
.modal-leave-active .admin-action-modal {
  transition: transform 0.3s ease;
}

.modal-enter-from .admin-action-modal,
.modal-leave-to .admin-action-modal {
  transform: scale(0.9);
}
</style>

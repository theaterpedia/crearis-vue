/**
 * Workflow Component Library
 * 
 * Components for visualizing project workflow states,
 * transitions, and role-based permissions.
 * 
 * Components:
 * - StateFlowTimeline: Visual state progression timeline
 * - TransitionSummary: Expandable transition details
 */

export { default as StateFlowTimeline } from './StateFlowTimeline.vue'
export { default as TransitionSummary } from './TransitionSummary.vue'

// Re-export composables
export { useTransitionSummary } from '@/composables/useTransitionSummary'

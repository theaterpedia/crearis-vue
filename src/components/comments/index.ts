/**
 * Post-IT Comments Component Library
 * 
 * A playful comment system styled as colorful Post-IT notes
 * with role-based colors following Opus CSS conventions.
 * 
 * Components:
 * - PostITNote: Individual sticky note with tape effect
 * - PostITBoard: Masonry grid of notes
 * - PostITComposer: New comment input form
 * - PostITThread: Threaded replies with collapse
 * - PostITSidebar: Desktop sidebar panel
 * - MobileCommentsSheet: Mobile bottom sheet
 */

export { default as PostITNote } from './PostITNote.vue'
export { default as PostITBoard } from './PostITBoard.vue'
export { default as PostITComposer } from './PostITComposer.vue'
export { default as PostITThread } from './PostITThread.vue'
export { default as PostITSidebar } from './PostITSidebar.vue'
export { default as MobileCommentsSheet } from './MobileCommentsSheet.vue'

// Re-export types and helpers from composable
export type { PostITComment } from '@/composables/usePostITComments'
export { ROLE_COLORS, usePostITComments } from '@/composables/usePostITComments'

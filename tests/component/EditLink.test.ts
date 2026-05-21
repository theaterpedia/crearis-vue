/**
 * EditLink component tests — Phase-A C11 · plan §9b.3.
 *
 * Covers the conditional render + href construction. Mocks
 * `useHostMode` (the v-if discriminator) + `useRoute` (the path source)
 * so the component can be exercised independently of vue-router + DOM.
 */

import { describe, it, expect, vi } from 'vitest'
import { computed, ref, type ComputedRef } from 'vue'
import { mount } from '@vue/test-utils'

type MockMode = 'public' | 'app'
const mockMode = ref<MockMode>('app')
const mockPath = ref('/sites/uia/posts/foo')

vi.mock('@/composables/useHostMode', () => ({
    useHostMode: (): { host: string; mode: ComputedRef<MockMode> } => ({
        host: 'mocked',
        mode: computed(() => mockMode.value),
    }),
}))

vi.mock('vue-router', () => ({
    useRoute: () => ({
        get path() {
            return mockPath.value
        },
    }),
}))

import EditLink from '@/components/EditLink.vue'

describe('EditLink', () => {
    it("renders the anchor in public-mode", async () => {
        mockMode.value = 'public'
        const w = mount(EditLink)
        const a = w.find('a.edit-link')
        expect(a.exists()).toBe(true)
        expect(a.text()).toBe('Edit this page')
    })

    it("does NOT render in app-mode", async () => {
        mockMode.value = 'app'
        const w = mount(EditLink)
        expect(w.find('a.edit-link').exists()).toBe(false)
    })

    it("href resolves to my.theaterpedia.org + the current route.path (host-rewrite)", async () => {
        mockMode.value = 'public'
        mockPath.value = '/sites/uia/posts/foo'
        const w = mount(EditLink)
        expect(w.find('a.edit-link').attributes('href')).toBe(
            'https://my.theaterpedia.org/sites/uia/posts/foo',
        )
    })

    it("href tracks route.path updates (events surface)", async () => {
        mockMode.value = 'public'
        mockPath.value = '/sites/uia/events/conference__foo'
        const w = mount(EditLink)
        expect(w.find('a.edit-link').attributes('href')).toBe(
            'https://my.theaterpedia.org/sites/uia/events/conference__foo',
        )
    })

    it('sets rel="noopener" for cross-domain link safety', async () => {
        mockMode.value = 'public'
        const w = mount(EditLink)
        expect(w.find('a.edit-link').attributes('rel')).toBe('noopener')
    })

    it('renders for the project home path (no posts/events suffix)', async () => {
        mockMode.value = 'public'
        mockPath.value = '/sites/uia'
        const w = mount(EditLink)
        expect(w.find('a.edit-link').attributes('href')).toBe(
            'https://my.theaterpedia.org/sites/uia',
        )
    })
})

/**
 * uia · the three views actually mount and render their content.
 *
 * A build succeeding only proves the modules resolve. This proves the templates
 * run: no undefined access, no missing import, no prop-type mismatch — and that
 * the load-bearing strings really reach the DOM.
 *
 * Three of these assertions are not about mechanics at all, and they are the
 * point of the file:
 *
 *   - **The two protected spellings survive** (§7). „wir tanzen drüber nach!"
 *     and „dekonstruirt" are the collective's own, not typos. If a future
 *     proof-read or spell-check eats one, this goes red.
 *   - **The accessibility note renders** (§7). It appears twice in the owners'
 *     material; it is not a footnote to drop.
 *   - **The three empty navstops stay in the nav** (§1). A nav that lies about
 *     what exists is worse than a nav with a stub behind it.
 *
 * `fetch` is stubbed to reject, which is not a workaround but the actual uia
 * runtime: this site deploys as its own pm2 process with no DB and no
 * `/api/themes` (§2). So these mounts exercise the bundled-theme fallback path
 * on purpose.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import LandingPage from '@/views/Uia/LandingPage.vue'
import AgendaPage from '@/views/Uia/AgendaPage.vue'
import StubPage from '@/views/Uia/StubPage.vue'
import { navItems, stub } from '@/views/Uia/content/nav'
import { contact } from '@/views/Uia/content/landing'

function makeRouter(): Router {
    return createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/', component: LandingPage },
            { path: '/agenda', component: AgendaPage },
            { path: '/vision', component: StubPage },
            { path: '/blog', component: StubPage },
            { path: '/kontakt', component: StubPage },
        ],
    })
}

async function mountPage(component: unknown) {
    const router = makeRouter()
    router.push('/')
    await router.isReady()
    const wrapper = mount(component as never, { global: { plugins: [router] } })
    await vi.waitFor(() => expect(wrapper.html().length).toBeGreaterThan(0))
    return wrapper
}

beforeEach(() => {
    // No backend, as in the real deploy. The theme layer must cope on its own.
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no backend — uia ships without one'))))
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('LandingPage', () => {
    it('mounts and renders the masthead', async () => {
        const text = (await mountPage(LandingPage)).text()
        expect(text).toContain('Utopie ist, wo wir sind')
        expect(text).toContain('Theater der Unterdrückten')
    })

    it('renders the agenda band and the invitation band side by side', async () => {
        const text = (await mountPage(LandingPage)).text()
        expect(text).toContain('nächste Termine')
        expect(text).toContain("Let's rehearse reality")
        // The Ungerechtigkeit-triad, as a list rather than prose.
        expect(text).toContain('Stress & mentale Belastung')
    })

    it('renders the live project with its question-block and the highlight line', async () => {
        const text = (await mountPage(LandingPage)).text()
        expect(text).toContain('Meine Grenzen')
        expect(text).toContain('Wer zieht sie mir? Ich oder andere?')
        expect(text).toContain('findet ab 10 Teilnehmenden statt')
    })

    it('renders the Akteure — pseudonym codes, organisations clear-named (§7)', async () => {
        const text = (await mountPage(LandingPage)).text()
        expect(text).toContain('MATTIS30')
        expect(text).toContain('TanzAllee e.V.')
    })

    it('keeps all four navstops in the nav, including the three empty ones (§1)', async () => {
        const text = (await mountPage(LandingPage)).text()
        for (const item of navItems) {
            expect(text, `navstop missing: ${item.label}`).toContain(item.label)
        }
    })

    it('renders the accessibility note — it is not a footnote to drop (§7)', async () => {
        expect((await mountPage(LandingPage)).text()).toContain(contact.accessibility)
    })
})

describe('AgendaPage', () => {
    it('mounts and renders the arc at full depth', async () => {
        const text = (await mountPage(AgendaPage)).text()
        expect(text).toContain('Unsere Agenda')
        expect(text).toContain('Meine Grenzen')
        expect(text).toContain('Alle Termine')
    })

    it('renders the full 15-Mittwoch run, first and last', async () => {
        const text = (await mountPage(AgendaPage)).text()
        expect(text).toContain('MI 23.09.26')
        expect(text).toContain('MI 20.01.27')
    })

    it('renders the Beitrag tiers in their 2026 vocabulary', async () => {
        const text = (await mountPage(AgendaPage)).text()
        expect(text).toContain('Kostendecker')
        expect(text).toContain('goldene Mitte')
        expect(text).toContain('Möglichmacher')
        // The older Super-Early-Bird / Solidarpreis set is explicitly NOT this.
        expect(text).not.toContain('Early-Bird')
        expect(text).not.toContain('Solidarpreis')
    })

    it('leaves the Kernprogramm Beitrag unrendered while it is null — no invented number', async () => {
        const text = (await mountPage(AgendaPage)).text()
        expect(text).toContain('Unser Kernprogramm')
        expect(text).not.toMatch(/Kernprogramm[\s\S]{0,400}?\d+\s?€/)
    })

    it('renders the FLINTA*+ modes, both of them, plainly', async () => {
        const text = (await mountPage(AgendaPage)).text()
        expect(text).toContain('FLINTA*+ Spaces')
        expect(text).toContain('FLINTA*+ Sensitivität')
    })
})

describe('the protected spellings survive rendering (§7)', () => {
    it('keeps „wir tanzen drüber nach!" — their pun on nachdenken, not a typo', async () => {
        expect((await mountPage(LandingPage)).text()).toContain('wir tanzen drüber nach!')
        expect((await mountPage(AgendaPage)).text()).toContain('wir tanzen drüber nach!')
    })

    it('keeps „dekonstruirt" — their flyer`s spelling, not a typo', async () => {
        expect((await mountPage(LandingPage)).text()).toContain('dekonstruirt')
        expect((await mountPage(AgendaPage)).text()).toContain('dekonstruirt')
    })
})

describe('StubPage', () => {
    it('mounts and says plainly that it is empty, in the content-file`s words', async () => {
        const text = (await mountPage(StubPage)).text()
        expect(text).toContain(stub.headline)
        expect(text).toContain(stub.body)
    })

    it('points at the two things that do exist — the agenda and the inbox', async () => {
        const text = (await mountPage(StubPage)).text()
        expect(text).toContain(stub.link.label)
        expect(text).toContain(contact.email)
    })
})

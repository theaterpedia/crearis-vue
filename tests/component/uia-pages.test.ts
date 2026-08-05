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

describe('the topnav belongs to uia, not to Theaterpedia', () => {
    // Caught in the browser, not by a build: `Logo.vue` renders the Theaterpedia
    // wordmark inside an <h1>, so it was both the wrong brand in the uia topnav
    // and the FIRST h1 on every page, ahead of the real headline. Fixed with
    // showLogo="no" (see UiaPageFrame).
    for (const [label, page] of [['LandingPage', LandingPage], ['AgendaPage', AgendaPage], ['StubPage', StubPage]] as const) {
        it(`${label} shows no Theaterpedia wordmark`, async () => {
            const wrapper = await mountPage(page)
            expect(wrapper.find('.topnav-logo').exists()).toBe(false)
            expect(wrapper.text()).not.toContain('Theaterpedia')
        })

        it(`${label} has exactly one h1, and it is the page's own headline`, async () => {
            const headings = (await mountPage(page)).findAll('h1')
            expect(headings).toHaveLength(1)
            expect(headings[0]?.text()).not.toContain('Theaterpedia')
        })
    }

    it('keeps the theme switcher reachable even on the landing (§3)', async () => {
        // The landing runs navbarMode="home", and TopNav's 'home' default hides the
        // actions-slot along with the logo — which hid the switcher exactly where HP
        // most wants to compare themes. allowActions="yes" decouples the two.
        expect((await mountPage(LandingPage)).find('.theme-toggle-btn').exists()).toBe(true)
        expect((await mountPage(AgendaPage)).find('.theme-toggle-btn').exists()).toBe(true)
    })
})

describe('AgendaPage · DB-driven (HD 2026-08-06: „fully dynamically … only db-bound components")', () => {
    // The default stub (fetch rejects) IS the outage case: authored fallback
    // rows in the list, closedArcs cards in „Was schon war", no featured band.
    it('mounts on outage with the authored fallback — hero, Alle Termine, the closed arcs', async () => {
        const text = (await mountPage(AgendaPage)).text()
        expect(text).toContain('Unsere Agenda')
        expect(text).toContain('Alle Termine')
        expect(text).toContain('Meine Grenzen')
        expect(text).toContain('Was schon war')
    })

    it('does NOT render the July sections — dropped as not-db-bound (Beitrag, Kernprogramm-prose, FLINTA, date-run)', async () => {
        const text = (await mountPage(AgendaPage)).text()
        expect(text).not.toContain('Kostendecker')
        expect(text).not.toContain('Dort gibt es Theater der Unterdrückten')
        expect(text).not.toContain('FLINTA*+ Spaces')
        expect(text).not.toContain('MI 20.01.27')
    })

    function mockDb(events: unknown[], posts: unknown[]) {
        vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
            const url = String(input)
            const respond = (payload: unknown) => Promise.resolve(new Response(JSON.stringify(payload), {
                status: 200, headers: { 'Content-Type': 'application/json' },
            }))
            if (url.includes('/api/events')) return respond(events)
            if (url.includes('/api/posts')) return respond(posts)
            if (url.includes('/api/projects/')) return respond({ heading: '**Utopia in Action** — Theater der Unterdrückten' })
            return Promise.reject(new Error('no backend — uia ships without one'))
        }))
    }

    it('features the FIRST item of „Alle Termine" as the band (HD ruling ⑤), with its link', async () => {
        mockDb(
            [
                { id: 8, name: 'Meine Grenzen', teaser: 'ein Tanztheater-Projekt · Anmeldung bis 10.09.26', date_begin: '2099-09-23T19:00:00', date_end: '2099-09-23T21:00:00' },
                { id: 9, name: 'Meine Grenzen · wir zeigen es', teaser: 'Abschluss-Aufführung (vsl.)', date_begin: '2099-11-22T19:00:00' },
            ],
            [],
        )
        const wrapper = await mountPage(AgendaPage)
        await vi.waitFor(() => expect(wrapper.text()).toContain('mehr erfahren'))
        const text = wrapper.text()
        expect(text).toContain('ein Tanztheater-Projekt · Anmeldung bis 10.09.26')
        // The project's own heading (db) drives the hero, md markers stripped.
        expect(text).toContain('Utopia in Action — Theater der Unterdrückten')
        expect(text).not.toContain('**Utopia in Action**')
    })

    it('renders db posts as rows under „Was schon war"', async () => {
        mockDb(
            [{ id: 8, name: 'Meine Grenzen', date_begin: '2099-09-23T19:00:00' }],
            [{ id: 10, name: "Let's perform Utopia", teaser: 'Freiheit tanzen · Gleichberechtigung singen', post_date: '2026-07-24' }],
        )
        const wrapper = await mountPage(AgendaPage)
        await vi.waitFor(() => expect(wrapper.text()).toContain("Let's perform Utopia"))
        expect(wrapper.text()).toContain('Was schon war')
    })

    it('renders „Nächste Termine" + „... auf Anfrage" when the stores answer empty (HD, verbatim)', async () => {
        mockDb([], [])
        const wrapper = await mountPage(AgendaPage)
        await vi.waitFor(() => expect(wrapper.text()).toContain('Nächste Termine'))
        const text = wrapper.text()
        expect(text).toContain('... auf Anfrage')
        expect(text).not.toContain('Alle Termine')
        // An empty posts answer HIDES the band — nothing to advertise.
        expect(text).not.toContain('Was schon war')
    })
})

describe('the protected spellings survive rendering (§7)', () => {
    // ⚠ Since the DB-driven turn, „wir tanzen drüber nach!" lives in TWO places:
    // the landing's authored band-2 (pinned here) and events#8.md IN THE DB —
    // the db copy has no mechanical gate yet (flagged in uia thread §10.7ff).
    it('keeps „wir tanzen drüber nach!" — their pun on nachdenken, not a typo', async () => {
        expect((await mountPage(LandingPage)).text()).toContain('wir tanzen drüber nach!')
    })

    it('keeps „dekonstruirt" — their flyer`s spelling, not a typo', async () => {
        // Landing: the pastArcs outage-fallback · Agenda: the closedArcs fallback.
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

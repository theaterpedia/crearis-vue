/**
 * Landing-page content · dummy-state per HM-2026-06-02 PM.
 *
 * Real content is being decided. Per the gesture-naming-hold memory
 * (project_magnifica_gesture_mode_naming_hold), when real content lands the
 * gesture-mode design should be named somewhere in the artefact's own text.
 * For now: placeholder PostIts that name themselves as dummy.
 *
 * Authoring-pattern: TypeScript modules exporting CardsCanvasItem[] per
 * crearis:projects/magnifica/docs/integration-directions.md §5.
 */

import type { CardsCanvasItem } from '@/components/magnifica/types'

export const pageTitle = 'Response to Chris Olah · Magnifica humanitas, in lived practice'

export const postits: ReadonlyArray<CardsCanvasItem> = [
    {
        props: {
            overline: 'Substrate-point 1',
            headline: 'DAS Ei',
            bodyText: 'Theaterpädagogik as embodied practice · 30 years of training.',
            themeColor: 'yellow',
        },
    },
    {
        props: {
            overline: 'Substrate-point 2',
            headline: 'Crearis',
            bodyText: 'The working network · craft-rooted · curriculum-grounded.',
            themeColor: 'green',
        },
    },
    {
        props: {
            overline: 'Substrate-point 3',
            headline: 'Theaterpedia.org',
            bodyText: 'This artefact · re-inhabited 2022 first-attempt · the page is the response.',
            themeColor: 'pink',
        },
    },
    {
        props: {
            overline: 'Dummy-state',
            headline: 'Real content lands when HM ships',
            bodyText: 'Placeholder per CV@wsl 2026-06-02 PM · gesture-naming-hold pending real-content decision.',
            themeColor: 'dim',
        },
    },
]

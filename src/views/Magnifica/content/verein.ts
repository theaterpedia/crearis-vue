/**
 * Verein-page content · dummy-state per HM-2026-06-02 PM. Real content TBD.
 */

import type { CardsCanvasItem } from '@/components/magnifica/types'

export const pageTitle = 'Verein'

export const postits: ReadonlyArray<CardsCanvasItem> = [
    {
        props: {
            overline: 'Verein',
            headline: 'The association · structural carrier',
            bodyText: 'The non-profit-form that holds the practice across time.',
            themeColor: 'pink',
        },
    },
    {
        props: {
            overline: 'Dummy-state',
            headline: 'Placeholder',
            bodyText: 'Real verein-content lands when HM ships.',
            themeColor: 'dim',
        },
    },
]

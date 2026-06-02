/**
 * Toolbox-page content · dummy-state per HM-2026-06-02 PM. Real content TBD.
 */

import type { CardsCanvasItem } from '@/components/magnifica/types'

export const pageTitle = 'Toolbox'

export const postits: ReadonlyArray<CardsCanvasItem> = [
    {
        props: {
            overline: 'Toolbox',
            headline: 'The instruments of the practice',
            bodyText: 'Methods · scores · session-templates · the worked-with substrate.',
            themeColor: 'green',
        },
    },
    {
        props: {
            overline: 'Dummy-state',
            headline: 'Placeholder',
            bodyText: 'Real toolbox-content lands when HM ships.',
            themeColor: 'dim',
        },
    },
]

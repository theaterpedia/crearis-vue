/**
 * usePageOptions - Utility for parsing and managing page layout options
 * Handles aside and footer options from projects or pages tables
 */

export interface AsideOptions {
    postit?: {
        enabled?: boolean
        title?: string
        content?: string
        color?: string
    }
    toc?: {
        enabled?: boolean
        title?: string
    }
    list?: {
        type?: 'posts' | 'events' | 'instructors' | 'projects' | 'images'
        header?: string
    }
    context?: {
        content?: string
    }
}

export interface FooterOptions {
    gallery?: {
        type?: 'posts' | 'events' | 'instructors' | 'projects' | 'images'
        header?: string
    }
    postit?: {
        enabled?: boolean
        title?: string
        content?: string
        color?: string
    }
    slider?: {
        type?: 'posts' | 'events' | 'instructors' | 'projects' | 'images'
        header?: string
    }
    repeat?: {
        enabled?: boolean
        title?: string
        sections?: any[]
        columns?: number
    }
}

/**
 * Parse aside options from flat project fields or JSONB
 */
export function parseAsideOptions(data: any): AsideOptions {
    const options: AsideOptions = {}

    // Handle postit
    if (data.aside_postit) {
        try {
            options.postit = typeof data.aside_postit === 'string'
                ? JSON.parse(data.aside_postit)
                : data.aside_postit
        } catch (e) {
            console.error('Error parsing aside_postit:', e)
        }
    }

    // Handle TOC
    if (data.aside_toc) {
        options.toc = {
            enabled: data.aside_toc !== 'none',
            title: 'Table of Contents'
        }
    }

    // Handle list
    if (data.aside_list && data.aside_list !== 'none') {
        options.list = {
            type: data.aside_list as any,
            header: `Related ${data.aside_list}`
        }
    }

    // Handle context
    if (data.aside_context) {
        try {
            const contextData = typeof data.aside_context === 'string'
                ? JSON.parse(data.aside_context)
                : data.aside_context

            // Ensure content is a string, not an object
            const contentString = typeof contextData === 'object' && contextData !== null
                ? contextData.content
                : contextData

            if (contentString && typeof contentString === 'string') {
                options.context = { content: contentString }
            }
        } catch (e) {
            // Only set if it's a non-empty string
            if (typeof data.aside_context === 'string' && data.aside_context.trim()) {
                options.context = { content: data.aside_context }
            }
        }
    }

    return options
}

/**
 * Parse footer options from flat project fields or JSONB
 */
export function parseFooterOptions(data: any): FooterOptions {
    const options: FooterOptions = {}

    // Handle gallery
    if (data.footer_gallery && data.footer_gallery !== 'none') {
        options.gallery = {
            type: data.footer_gallery as any,
            header: `${data.footer_gallery} Gallery`
        }
    }

    // Handle postit
    if (data.footer_postit) {
        try {
            options.postit = typeof data.footer_postit === 'string'
                ? JSON.parse(data.footer_postit)
                : data.footer_postit
        } catch (e) {
            console.error('Error parsing footer_postit:', e)
        }
    }

    // Handle slider
    if (data.footer_slider && data.footer_slider !== 'none') {
        options.slider = {
            type: data.footer_slider as any,
            header: `${data.footer_slider} Slider`
        }
    }

    // Handle repeat
    if (data.footer_repeat) {
        try {
            options.repeat = typeof data.footer_repeat === 'string'
                ? JSON.parse(data.footer_repeat)
                : data.footer_repeat
        } catch (e) {
            console.error('Error parsing footer_repeat:', e)
        }
    }

    return options
}

/**
 * Check if aside has any content
 */
export function hasAsideContent(options: AsideOptions): boolean {
    return !!(
        (options.postit?.enabled) ||
        (options.toc?.enabled) ||
        (options.list?.type) ||
        (options.context?.content)
    )
}

/**
 * Check if footer has any content
 */
export function hasFooterContent(options: FooterOptions): boolean {
    return !!(
        (options.gallery?.type) ||
        (options.postit?.enabled) ||
        (options.slider?.type) ||
        (options.repeat?.enabled)
    )
}

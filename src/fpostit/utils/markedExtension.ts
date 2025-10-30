/**
 * Marked.js extension for Floating Post-It syntax
 * 
 * Syntax:
 * ::fpostit[p1]{title="Learn More" color="accent" hlogic="right"}
 * Content with **markdown** support
 * [Action 1](href1){.fpostact1}
 * [Action 2](href2){.fpostact2}
 * ::
 * 
 * Outputs:
 * <div data-fpostcontainer data-fpostkey="p1">
 *   <a data-fpostlink data-hlogic="right">Learn More</a>
 *   <div style="display:none" data-fpostcontent data-color="accent">
 *     <p>Content with <strong>markdown</strong> support</p>
 *     <a href="href1" data-fpostact1>Action 1</a>
 *     <a href="href2" data-fpostact2>Action 2</a>
 *   </div>
 * </div>
 */

import type { Tokens, TokenizerExtension, RendererExtension } from 'marked'

interface FpostitToken {
    type: 'fpostit'
    raw: string
    key: string
    title: string
    color?: string
    hlogic?: string
    image?: string
    svg?: string
    content: string
    tokens: Tokens.Generic[]
}

/**
 * Tokenizer: Matches ::fpostit[key]{attrs}\ncontent\n::
 */
export const fpostitTokenizer: TokenizerExtension = {
    name: 'fpostit',
    level: 'block',
    start(src: string) {
        return src.match(/^::fpostit\[/)?.index
    },
    tokenizer(src: string) {
        // Match opening: ::fpostit[p1]{title="..." color="..." hlogic="..."}
        const match = src.match(/^::fpostit\[([a-z0-9]+)\]\{([^}]+)\}\n([\s\S]*?)\n::/)

        if (!match) return undefined

        const [raw, key, attrs, content] = match

        // Parse attributes
        const titleMatch = attrs.match(/title="([^"]+)"/)
        const colorMatch = attrs.match(/color="([^"]+)"/)
        const hlogicMatch = attrs.match(/hlogic="([^"]+)"/)
        const imageMatch = attrs.match(/image="([^"]+)"/)
        const svgMatch = attrs.match(/svg="([^"]+)"/)

        const title = titleMatch ? titleMatch[1] : 'Learn More'
        const color = colorMatch ? colorMatch[1] : 'primary'
        const hlogic = hlogicMatch ? hlogicMatch[1] : 'default'
        const image = imageMatch ? imageMatch[1] : undefined
        const svg = svgMatch ? svgMatch[1] : undefined

        // Tokenize content (for markdown support inside)
        const tokens = this.lexer.blockTokens(content.trim())

        return {
            type: 'fpostit',
            raw,
            key,
            title,
            color,
            hlogic,
            image,
            svg,
            content: content.trim(),
            tokens
        } as FpostitToken
    }
}

/**
 * Renderer: Outputs HTML with data attributes
 */
export const fpostitRenderer: RendererExtension = {
    name: 'fpostit',
    renderer(token: FpostitToken) {
        // Parse inner content to extract actions
        const contentHtml = this.parser.parse(token.tokens)

        // Extract action links: [Text](href){.fpostact1}
        const actionRegex = /<a href="([^"]+)"[^>]*>\{\.fpostact([12])\}([^<]+)<\/a>/g
        const actions: Array<{ href: string; label: string; index: string }> = []
        let match

        while ((match = actionRegex.exec(contentHtml)) !== null) {
            actions.push({
                href: match[1],
                label: match[3],
                index: match[2]
            })
        }

        // Remove action markers from content
        const cleanContent = contentHtml.replace(/\{\.fpostact[12]\}/g, '')

        // Build action links HTML
        const actionLinks = actions.map(action => {
            return `<a href="${action.href}" data-fpostact${action.index}>${action.label}</a>`
        }).join('\n    ')

        // Build data attributes for hidden content
        const contentAttrs = [
            'data-fpostcontent',
            token.color ? `data-color="${token.color}"` : '',
            token.image ? `data-image="${token.image}"` : '',
            token.svg ? `data-svg='${token.svg}'` : ''
        ].filter(Boolean).join(' ')

        // Output HTML structure
        return `<div data-fpostcontainer data-fpostkey="${token.key}">
  <a href="#" data-fpostlink data-hlogic="${token.hlogic}">${token.title}</a>
  <div style="display:none" ${contentAttrs}>
    ${cleanContent}
    ${actionLinks}
  </div>
</div>`
    }
}

/**
 * Combined extension object for marked.use()
 */
export const fpostitExtension = {
    extensions: [fpostitTokenizer, fpostitRenderer]
}
